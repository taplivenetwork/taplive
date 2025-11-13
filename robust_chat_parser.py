#!/usr/bin/env python3
import re
import json
import codecs

def extract_conversations_robust():
    """更稳健的对话提取方法"""
    print("开始稳健解析...")
    
    with open('attached_assets/ChatGPT-2025-08/chat.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式直接搜索对话内容
    patterns = [
        r'TapLive.*?(?=",")',
        r'法律与合规.*?(?=",")',
        r'开发者许可.*?(?=",")',
        r'平台贡献者.*?(?=",")',
        r'风险与立场.*?(?=",")',
        r'创始人声明.*?(?=",")',
        r'合规声明.*?(?=",")',
        r'不发代币.*?(?=",")',
        r'Phase.*?(?=",")',
        r'\\u6cd5\\u5f8b.*?(?=",")',  # "法律" Unicode
        r'\\u5408\\u89c4.*?(?=",")',  # "合规" Unicode
        r'\\u534f\\u8bae.*?(?=",")',  # "协议" Unicode
        r'\\u653f\\u7b56.*?(?=",")',  # "政策" Unicode
        r'\\u58f0\\u660e.*?(?=",")',  # "声明" Unicode
    ]
    
    found_content = []
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
        for match in matches:
            # 解码Unicode
            try:
                decoded = match.encode('utf-8').decode('unicode_escape')
                found_content.append(decoded)
            except:
                found_content.append(match)
    
    return found_content

def search_specific_documents():
    """搜索特定文档的更完整版本"""
    print("搜索特定文档...")
    
    with open('attached_assets/ChatGPT-2025-08/chat.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 搜索完整的文档块
    doc_patterns = {
        '法律与合规范围说明': r'法律与合规范围说明.*?(?=\\n\\n|$)',
        '开发者许可协议': r'开发者许可协议.*?(?=\\n\\n|$)',
        '平台贡献者政策': r'平台贡献者政策.*?(?=\\n\\n|$)',
        '风险与立场声明': r'风险与立场声明.*?(?=\\n\\n|$)',
        '创始人声明': r'创始人声明.*?(?=\\n\\n|$)',
        '合规声明': r'合规声明.*?(?=\\n\\n|$)',
        '不发代币说明': r'不发代币说明.*?(?=\\n\\n|$)',
    }
    
    found_docs = {}
    
    for doc_name, pattern in doc_patterns.items():
        # 尝试不同的搜索方式
        searches = [
            pattern,
            pattern.replace('说明', ''),
            # Unicode版本
            pattern.encode('unicode_escape').decode('ascii'),
        ]
        
        for search_pattern in searches:
            matches = re.findall(search_pattern, content, re.IGNORECASE | re.DOTALL)
            if matches:
                for match in matches:
                    try:
                        decoded = match.encode('utf-8').decode('unicode_escape')
                        if doc_name not in found_docs:
                            found_docs[doc_name] = []
                        found_docs[doc_name].append(decoded)
                    except:
                        if doc_name not in found_docs:
                            found_docs[doc_name] = []
                        found_docs[doc_name].append(match)
    
    return found_docs

def extract_by_chunks():
    """分块提取方法"""
    print("使用分块提取方法...")
    
    with open('attached_assets/ChatGPT-2025-08/chat.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到JSON开始位置
    json_start = content.find('var jsonData = [')
    if json_start == -1:
        print("未找到JSON数据")
        return []
    
    json_start += len('var jsonData = ')
    json_end = content.find('];', json_start)
    if json_end == -1:
        print("未找到JSON结束位置")
        return []
    
    json_str = content[json_start:json_end+1]
    
    # 按对话分割
    conversations = []
    # 查找所有的对话开始位置
    conv_pattern = r'{"title":\s*"([^"]*)"[^}]*"create_time":[^}]*"update_time":[^}]*"mapping":'
    
    for match in re.finditer(conv_pattern, json_str):
        title = match.group(1)
        try:
            title_decoded = title.encode('utf-8').decode('unicode_escape')
            conversations.append(title_decoded)
        except:
            conversations.append(title)
    
    return conversations

def main():
    print("=== TapLive聊天内容提取 ===")
    
    # 方法1: 稳健提取
    print("\n1. 稳健提取方法:")
    robust_content = extract_conversations_robust()
    print(f"找到 {len(robust_content)} 个相关内容片段")
    
    # 方法2: 特定文档搜索
    print("\n2. 特定文档搜索:")
    specific_docs = search_specific_documents()
    for doc_name, content_list in specific_docs.items():
        print(f"{doc_name}: {len(content_list)} 个匹配")
        
    # 方法3: 分块提取对话标题
    print("\n3. 对话标题提取:")
    conversation_titles = extract_by_chunks()
    print(f"找到 {len(conversation_titles)} 个对话")
    
    # 显示对话标题
    print("\n对话标题列表:")
    for i, title in enumerate(conversation_titles[:20]):  # 只显示前20个
        print(f"{i+1:2d}. {title}")
    
    if len(conversation_titles) > 20:
        print(f"... 还有 {len(conversation_titles)-20} 个对话")
    
    # 寻找TapLive相关对话
    taplive_titles = []
    keywords = ['taplive', 'tap', '直播', '视频', '流媒体', '合规', '法律', '协议', '声明', '政策', 'phase', '开发']
    
    for title in conversation_titles:
        if any(keyword.lower() in title.lower() for keyword in keywords):
            taplive_titles.append(title)
    
    print(f"\nTapLive相关对话 ({len(taplive_titles)} 个):")
    for i, title in enumerate(taplive_titles):
        print(f"{i+1:2d}. {title}")
    
    # 保存结果
    results = {
        'robust_content': robust_content,
        'specific_docs': specific_docs,
        'conversation_titles': conversation_titles,
        'taplive_titles': taplive_titles
    }
    
    with open('chat_extraction_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n结果已保存到 chat_extraction_results.json")

if __name__ == "__main__":
    main()