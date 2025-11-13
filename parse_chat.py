#!/usr/bin/env python3
import json
import re
import html
import codecs

def decode_unicode_string(s):
    """解码Unicode字符串"""
    try:
        return codecs.decode(s, 'unicode_escape')
    except:
        return s

def extract_conversation_messages(conversation):
    """提取对话中的消息"""
    messages = []
    mapping = conversation.get('mapping', {})
    current_node = conversation.get('current_node')
    
    # 遍历消息节点
    visited = set()
    def traverse_node(node_id):
        if not node_id or node_id in visited:
            return
        visited.add(node_id)
        
        node = mapping.get(node_id)
        if not node:
            return
            
        message = node.get('message')
        if message and message.get('content') and message.get('content', {}).get('parts'):
            author = message.get('author', {}).get('role', 'unknown')
            parts = message.get('content', {}).get('parts', [])
            
            if parts and len(parts) > 0 and author != 'system':
                content = []
                for part in parts:
                    if isinstance(part, str) and part.strip():
                        content.append(part)
                
                if content:
                    messages.append({
                        'author': author,
                        'content': '\n'.join(content),
                        'create_time': message.get('create_time')
                    })
        
        # 遍历子节点
        children = node.get('children', [])
        for child_id in children:
            traverse_node(child_id)
    
    # 从根节点开始遍历
    root_nodes = [node_id for node_id, node in mapping.items() if node.get('parent') is None]
    for root_id in root_nodes:
        traverse_node(root_id)
    
    # 按时间排序
    messages.sort(key=lambda x: x.get('create_time') or 0)
    return messages

def main():
    print("开始解析ChatGPT导出文件...")
    
    try:
        # 读取HTML文件
        with open('attached_assets/ChatGPT-2025-08/chat.html', 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("文件读取完成")
        
        # 提取JSON数据
        json_match = re.search(r'var jsonData = (\[.*?\]);', content, re.DOTALL)
        if not json_match:
            print("未找到JSON数据")
            return
        
        json_str = json_match.group(1)
        print(f"JSON数据长度: {len(json_str)}")
        
        # 分段解析JSON（处理大文件）
        try:
            conversations = json.loads(json_str)
            print(f"成功解析，共找到 {len(conversations)} 个对话")
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            # 尝试修复JSON
            print("尝试修复JSON...")
            json_str = json_str.replace('\\n', '\\\\n').replace('\\t', '\\\\t')
            try:
                conversations = json.loads(json_str)
                print(f"修复成功，共找到 {len(conversations)} 个对话")
            except:
                print("JSON修复失败，使用分段处理...")
                return
        
        # 寻找TapLive相关对话
        taplive_conversations = []
        
        for i, conv in enumerate(conversations):
            title = conv.get('title', '')
            # 解码Unicode标题
            if title:
                try:
                    title_decoded = title.encode('utf-8').decode('unicode_escape')
                except:
                    title_decoded = title
                
                print(f"对话 {i+1}: {title_decoded}")
                
                # 检查是否与TapLive相关
                taplive_keywords = ['taplive', 'tap live', '直播', '视频', '流媒体', '合规', '法律', '协议', '声明', '政策']
                if any(keyword in title_decoded.lower() for keyword in taplive_keywords):
                    taplive_conversations.append((i, title_decoded, conv))
                    print(f"  -> 这是TapLive相关对话！")
        
        print(f"\n找到 {len(taplive_conversations)} 个TapLive相关对话")
        
        # 提取每个相关对话的内容
        all_taplive_content = []
        
        for idx, title, conv in taplive_conversations:
            print(f"\n处理对话: {title}")
            messages = extract_conversation_messages(conv)
            
            print(f"  消息数量: {len(messages)}")
            
            for msg in messages:
                content = msg['content']
                # 解码Unicode内容
                try:
                    content_decoded = content.encode('utf-8').decode('unicode_escape') 
                except:
                    content_decoded = content
                
                all_taplive_content.append({
                    'conversation': title,
                    'author': msg['author'],
                    'content': content_decoded,
                    'create_time': msg.get('create_time')
                })
        
        # 保存提取的内容
        with open('taplive_chat_content.json', 'w', encoding='utf-8') as f:
            json.dump(all_taplive_content, f, ensure_ascii=False, indent=2)
        
        print(f"\n提取完成！共提取 {len(all_taplive_content)} 条TapLive相关消息")
        print("内容已保存到 taplive_chat_content.json")
        
        # 搜索关键文档
        print("\n搜索关键文档...")
        key_documents = [
            "法律与合规范围说明",
            "开发者许可协议", 
            "平台贡献者政策",
            "风险与立场声明",
            "创始人声明",
            "合规声明与中立性说明",
            "不发代币说明",
            "Phase"
        ]
        
        found_docs = {}
        for item in all_taplive_content:
            content = item['content']
            for doc_name in key_documents:
                if doc_name in content:
                    if doc_name not in found_docs:
                        found_docs[doc_name] = []
                    found_docs[doc_name].append(item)
        
        print("找到的关键文档:")
        for doc_name, items in found_docs.items():
            print(f"  {doc_name}: {len(items)} 处提及")
        
        # 保存关键文档
        with open('taplive_key_documents.json', 'w', encoding='utf-8') as f:
            json.dump(found_docs, f, ensure_ascii=False, indent=2)
            
        print("关键文档已保存到 taplive_key_documents.json")
        
    except Exception as e:
        print(f"处理过程中出错: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()