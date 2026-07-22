#!/usr/bin/env python3
"""
OCR script using PaddleOCR for WhatsApp screenshot text extraction.
Uses deterministic layout parsing instead of AI models.

Workflow:
1. OCR extracts all text lines with positions
2. Process sequentially — add messages one by one
3. When reply pattern detected → check if NEXT text already exists in chat
   - YES → it's a reply, add it and link to the previous message
   - NO → it's quoted text from outside screenshot, skip it
4. Continue to next text
"""

import sys
import json
import os
import re

FILTER_PATTERNS = [
    r'^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM|am|pm)?$',
    r'^(today|yesterday|mon|tue|wed|thu|fri|sat|sun)\s+\d{1,2}:\d{2}(\s*(am|pm))?$', 
    r'^(今天|昨天|星期[一二三四五六日天])$',
    r'^\d{1,2}/\d{1,2}/\d{2,4}$',
    r'^\d{4}/\d{1,2}/\d{1,2}$',
    r'^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}$',
    r'^\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$',
    r'^\d{1,2}\s*月\s*\d{1,2}日?$',
    r'^\d+\s*(minutes?|hours?|days?|weeks?)\s*ago$',
    r'^\d+\s*(分钟|小时|天|周)前$',
    r'^\d+$',
]

FILTER_KEYWORDS = [
    'message read', 'message sent', 'message delivered',
    'messages are end-to-end encrypted', '端到端加密', 'created group', '你创建了群组',
    'added you', '将你添加', 'connect on other platforms',
    'online', 'offline', 'typing', 'recording', 'seen',
    '在线', '离线', '正在输入', '录音中',
    'search', 'attach', 'camera', 'send', 'emoji', 'voice',
    '搜索', '附件', '相机', '发送', '表情', '语音',
    'message...', 'messages...',
]

REPLY_PATTERNS = [
    r'^you replied to',
    r'^replied to @',
    r'^replied to you',
    r'^你回复了',
    r'^.*replied to you$',
    r'^.*回复了你$',
]

NON_LATIN_RANGES = [
    (0x00C0, 0x024F),
    (0x0400, 0x04FF),
    (0x0600, 0x06FF),
    (0x0900, 0x097F),
]

def should_filter(text):
    text_lower = text.strip().lower()
    if len(text_lower) < 2:
        return True
    for kw in FILTER_KEYWORDS:
        if kw in text_lower:
            return True
    for pat in FILTER_PATTERNS:
        if re.match(pat, text_lower):
            return True
    for char in text.strip():
        code = ord(char)
        if (0x4E00 <= code <= 0x9FFF or 0x3400 <= code <= 0x4DBF or
            0x0041 <= code <= 0x005A or 0x0061 <= code <= 0x007A or
            0x0030 <= code <= 0x0039 or
            code in [0x0020, 0x0021, 0x002C, 0x002E, 0x003F, 0x0027, 0x0022,
                     0x3001, 0x3002, 0xFF01, 0xFF0C, 0xFF1F,
                     0x2026, 0x7E, 0x2014, 0x2013]):
            continue
        for start, end in NON_LATIN_RANGES:
            if start <= code <= end:
                return True
    return False

def is_reply_pattern(text):
    text_lower = text.strip().lower()
    for pat in REPLY_PATTERNS:
        if re.match(pat, text_lower):
            return True
    return False

def get_reply_sender(text):
    text_lower = text.strip().lower()
    if 'you replied to' in text_lower or '你回复了' in text_lower:
        return 'me'
    else:
        return 'them'

def bbox_center_x(bbox):
    return sum(p[0] for p in bbox) / 4

def bbox_top_y(bbox):
    return min(p[1] for p in bbox)

def extract_text(image_path: str, previous_messages: list = None) -> list:
    if previous_messages:
        print(f"[OCR] Previous messages received: {len(previous_messages)}", file=sys.stderr)
        for pm in previous_messages[:5]:
            print(f"[OCR]   Prev: '{pm.get('text', '')[:30]}' role={pm.get('role', '?')}", file=sys.stderr)
    else:
        print(f"[OCR] No previous messages received", file=sys.stderr)
    try:
        from paddleocr import PaddleOCR
        from PIL import Image
    except ImportError:
        return {"error": "PaddleOCR not installed. Run: pip install paddlepaddle paddleocr"}
    
    ocr = PaddleOCR(lang='ch')
    
    img = Image.open(image_path)
    
    if img.width > img.height * 1.3:
        img = img.rotate(90, expand=True)
        print(f"[OCR] Rotated landscape to portrait: {img.width}x{img.height}", file=sys.stderr)
    
    img_width, img_height = img.size
    
    pad = 100
    padded_img = Image.new('RGB', (img_width + pad * 2, img_height + pad * 2), (255, 255, 255))
    padded_img.paste(img, (pad, pad))
    
    padded_path = "/tmp/ocr_padded.png"
    padded_img.save(padded_path)
    
    print(f"[OCR] Image: {img_width}x{img_height}", file=sys.stderr)
    
    # Step 1: OCR - extract all text with bounding boxes
    all_lines = []
    result = ocr.predict(padded_path)
    
    for item in result:
        rec_texts = item.get('rec_texts', [])
        rec_scores = item.get('rec_scores', [])
        dt_polys = item.get('dt_polys', [])
        
        print(f"[OCR] Raw detections: {len(rec_texts)}", file=sys.stderr)
        
        for i, text in enumerate(rec_texts):
            print(f"[OCR] Raw[{i}]: {text.strip()[:50]}", file=sys.stderr)
        
        for i, text in enumerate(rec_texts):
            if not text or not text.strip():
                continue
            
            if should_filter(text):
                print(f"[OCR] Filtered: {text[:30]}", file=sys.stderr)
                continue
            
            if dt_polys and i < len(dt_polys):
                bbox = dt_polys[i].tolist() if hasattr(dt_polys[i], 'tolist') else dt_polys[i]
                x_center = bbox_center_x(bbox) - pad
                y_center = sum(p[1] for p in bbox) / 4 - pad
                position = "right" if x_center > img_width * 0.55 else "left"
            else:
                bbox = []
                y_center = len(all_lines) * 100
                position = "unknown"
            
            all_lines.append({
                "text": text.strip(),
                "confidence": float(rec_scores[i]) if rec_scores and i < len(rec_scores) else 0.9,
                "y": float(y_center),
                "position": position,
                "bbox": bbox
            })
    
    os.remove(padded_path)
    
    # Sort by vertical position
    all_lines.sort(key=lambda x: x["y"])
    
    # Process lines sequentially
    # WhatsApp reply bubble (top to bottom in OCR):
    # 1. "You replied to" (label)
    # 2. Quoted text (message being replied TO) — use to find match, but SKIP adding
    # 3. Actual reply text (the new message) — add this with replyTo link
    
    messages = []
    pending_reply = None       # Reply sender from reply pattern
    pending_quoted_match = None  # Matched message text (from checking quoted text)
    pending_quoted_role = None   # Role of the matched message
    
    i = 0
    while i < len(all_lines):
        line = all_lines[i]
        text = line['text']
        sender = 'me' if line['position'] == 'right' else 'them'
        
        # Check if this is a reply pattern
        if is_reply_pattern(text):
            pending_reply = get_reply_sender(text)
            print(f"[OCR] Reply pattern: {text[:30]} sender={pending_reply}", file=sys.stderr)
            
            # Next line is quoted text — use it to find the original message
            if i + 1 < len(all_lines):
                quoted_text = all_lines[i + 1]['text']
                
                # Search current messages (search in reverse for most recent match)
                for msg in reversed(messages):
                    msg_text = msg['text'].replace(' ', '').replace('\u3000', '')
                    q_text = quoted_text.replace(' ', '').replace('\u3000', '')
                    if msg_text == q_text or q_text in msg_text or msg_text in q_text:
                        pending_quoted_match = msg['text']
                        pending_quoted_role = msg['sender']
                        print(f"[OCR] Quoted match found (current): {quoted_text[:20]} (role={pending_quoted_role})", file=sys.stderr)
                        break
                
                # Search previous chat
                if not pending_quoted_match and previous_messages:
                    for msg in previous_messages:
                        msg_text = msg.get('text', '').replace(' ', '').replace('\u3000', '')
                        q_text = quoted_text.replace(' ', '').replace('\u3000', '')
                        if msg_text == q_text or q_text in msg_text or msg_text in q_text:
                            pending_quoted_match = msg.get('text', '')
                            pending_quoted_role = msg.get('role', 'girl')
                            print(f"[OCR] Quoted match found (previous): {quoted_text[:20]} (role={pending_quoted_role})", file=sys.stderr)
                            break
                
                if not pending_quoted_match:
                    print(f"[OCR] Quoted text not in chat (will skip): {quoted_text[:30]}", file=sys.stderr)
                
                # Skip the quoted text line (it's a preview, not a new message)
                i += 2
                continue
            
            i += 1
            continue
        
        # Normal message — add it
        msg = {
            'text': text,
            'sender': sender,
            'y': line['y'],
        }
        
        # If we have a pending reply, this is the actual reply message
        if pending_reply is not None:
            # Override sender based on reply pattern (more accurate than position)
            msg['sender'] = pending_reply
            
            # If we found a matching quoted message, link it with original role
            if pending_quoted_match:
                msg['replyTo'] = pending_quoted_match
                msg['replyToRole'] = pending_quoted_role or ('girl' if pending_reply == 'me' else 'user')
                print(f"[OCR] Adding reply: {text[:20]} (from {pending_reply}, replying to '{pending_quoted_match[:20]}', original_role={msg['replyToRole']})", file=sys.stderr)
            else:
                print(f"[OCR] Adding reply: {text[:20]} (from {pending_reply}, no quote link)", file=sys.stderr)
            
            pending_reply = None
            pending_quoted_match = None
            pending_quoted_role = None
        
        messages.append(msg)
        i += 1
    
    # Add IDs
    for idx, msg in enumerate(messages):
        msg['id'] = str(idx + 1)
    
    print(f"[OCR] Result: {len(messages)} messages", file=sys.stderr)
    for msg in messages:
        reply_info = f" (reply to: {msg.get('replyTo', '')[:20]})" if msg.get('replyTo') else ""
        print(f"[OCR]   {msg['sender']}: {msg['text'][:50]}{reply_info}", file=sys.stderr)
    
    return messages

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 ocr.py <image_path> [previous_messages_json]"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found: {image_path}"}))
        sys.exit(1)
    
    # Optional: previous messages JSON for reply linking
    previous_messages = None
    if len(sys.argv) > 2:
        try:
            previous_messages = json.loads(sys.argv[2])
        except:
            pass
    
    result = extract_text(image_path, previous_messages)
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
