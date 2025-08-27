import { useTranslation } from '@/hooks/use-translation';

interface TranslatedTextProps {
  children: string;
  className?: string;
}

export function TranslatedText({ 
  children, 
  className = ""
}: TranslatedTextProps) {
  const { currentLanguage } = useTranslation();
  
  // For non-English languages, return the original text and let CSS handle it
  // This avoids all async issues and React state problems
  if (currentLanguage === 'en' || !children) {
    return <span className={className}>{children}</span>;
  }

  // Simple mapping for common UI terms to avoid API calls entirely
  const translations: Record<string, Record<string, string>> = {
    'zh': {
      'Search by location or description...': '搜索位置或描述...',
      'All Categories': '所有类别',
      'Any Price': '任何价格',
      'Music': '音乐',
      'Food': '食物',
      'Travel': '旅行',
      'Events': '活动',
      'Fitness': '健身',
      'Education': '教育',
      'Available Orders': '可用订单',
      'My Orders': '我的订单',
      'Streaming Requests': '直播请求',
      'Creator': '创建者',
      'Price': '价格',
      'Total Pool': '总奖池',
      'Accept Order': '接受订单',
      'Join Stream': '加入直播',
      'Completed': '已完成',
      'Unavailable': '不可用',
      'Open': '开放',
      'Pending': '待处理',
      'Live': '直播中',
      'participants': '参与者',
      'min': '分钟',
      'Create Order': '创建订单',
      'Discover': '发现',
      'Earnings': '收益',
      'Settings': '设置',
      'Content Creator': '内容创作者',
      // Order content translations
      'Central Park Concert Stream': '中央公园音乐会直播',
      'Looking for someone to stream the outdoor concert happening at Central Park this evening': '正在寻找人来直播今晚在中央公园举行的户外音乐会',
      'Central Park, NYC': '纽约中央公园',
      'Food Market Tour': '美食市场之旅',
      'Want someone to stream a guided tour of Pike Place Market, showcasing local vendors and food': '希望有人直播派克市场的导览，展示当地商贩和食物',
      'Pike Place Market, Seattle': '西雅图派克市场',
      'Beach Sunset Yoga': '海滩日落瑜伽',
      'Stream a peaceful sunset yoga session at Santa Monica Beach for wellness enthusiasts': '为健康爱好者直播圣莫尼卡海滩宁静的日落瑜伽',
      'Santa Monica Beach, CA': '加利福尼亚州圣莫尼卡海滩',
      // Time translations
      'In 1h': '1小时后',
      'In 23h': '23小时后',
      'In 2 days': '2天后',
      'Tomorrow': '明天',
      'Now': '现在'
    },
    'ja': {
      'Search by location or description...': '場所や説明で検索...',
      'All Categories': 'すべてのカテゴリ',
      'Any Price': '任意の価格',
      'Music': '音楽',
      'Food': '食べ物',
      'Travel': '旅行',
      'Events': 'イベント',
      'Fitness': 'フィットネス',
      'Education': '教育',
      'Available Orders': '利用可能な注文',
      'My Orders': 'マイオーダー',
      'Creator': 'クリエイター',
      'Price': '価格',
      'Accept Order': '注文を受け入れる',
      'Join Stream': 'ストリームに参加',
      'Open': 'オープン',
      'Live': 'ライブ',
      'participants': '参加者',
      'min': '分',
      // Order content
      'Central Park Concert Stream': 'セントラルパークコンサートストリーム',
      'Looking for someone to stream the outdoor concert happening at Central Park this evening': '今夜セントラルパークで開催される野外コンサートをストリーミングしてくれる人を探しています',
      'Central Park, NYC': 'ニューヨーク、セントラルパーク',
      'Food Market Tour': 'フードマーケットツアー',
      'Want someone to stream a guided tour of Pike Place Market, showcasing local vendors and food': 'パイクプレイスマーケットのガイドツアーをストリーミングして、地元の業者と食べ物を紹介してほしい',
      'Pike Place Market, Seattle': 'シアトル、パイクプレイスマーケット',
      'Beach Sunset Yoga': 'ビーチサンセットヨガ',
      'Stream a peaceful sunset yoga session at Santa Monica Beach for wellness enthusiasts': 'ウェルネス愛好家のためにサンタモニカビーチで平和的な夕日ヨガセッションをストリーミング',
      'Santa Monica Beach, CA': 'カリフォルニア州、サンタモニカビーチ',
      // Time
      'In 1h': '1時間後',
      'In 23h': '23時間後', 
      'In 2 days': '2日後'
    },
    'es': {
      'Search by location or description...': 'Buscar por ubicación o descripción...',
      'All Categories': 'Todas las categorías',
      'Any Price': 'Cualquier precio',
      'Music': 'Música',
      'Food': 'Comida',
      'Travel': 'Viaje',
      'Events': 'Eventos',
      'Fitness': 'Fitness',
      'Education': 'Educación',
      'Available Orders': 'Pedidos disponibles',
      'My Orders': 'Mis pedidos',
      'Creator': 'Creador',
      'Price': 'Precio',
      'Accept Order': 'Aceptar pedido',
      'Join Stream': 'Unirse al stream',
      'Open': 'Abierto',
      'Live': 'En vivo',
      'participants': 'participantes',
      'min': 'min',
      // Order content
      'Central Park Concert Stream': 'Stream de Concierto en Central Park',
      'Looking for someone to stream the outdoor concert happening at Central Park this evening': 'Buscando a alguien para transmitir el concierto al aire libre que ocurre en Central Park esta noche',
      'Central Park, NYC': 'Central Park, Nueva York',
      'Food Market Tour': 'Tour del Mercado de Comida',
      'Want someone to stream a guided tour of Pike Place Market, showcasing local vendors and food': 'Quiero que alguien transmita un tour guiado del Mercado Pike Place, mostrando vendedores locales y comida',
      'Pike Place Market, Seattle': 'Mercado Pike Place, Seattle',
      'Beach Sunset Yoga': 'Yoga de Atardecer en la Playa',
      'Stream a peaceful sunset yoga session at Santa Monica Beach for wellness enthusiasts': 'Transmitir una sesión pacífica de yoga al atardecer en la Playa Santa Monica para entusiastas del bienestar',
      'Santa Monica Beach, CA': 'Playa Santa Monica, California',
      // Time
      'In 1h': 'En 1h',
      'In 23h': 'En 23h',
      'In 2 days': 'En 2 días'
    }
  };

  const translation = translations[currentLanguage]?.[children] || children;
  
  return <span className={className}>{translation}</span>;
}

