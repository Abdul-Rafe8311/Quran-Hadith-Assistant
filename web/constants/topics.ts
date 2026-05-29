export interface Topic {
  id: string;
  label: string;
  query: string;
  emoji: string;
}

export const TOPICS: Topic[] = [
  { id: 'patience', label: 'Patience', query: 'What does Islam say about patience?', emoji: '🤲' },
  { id: 'gratitude', label: 'Gratitude', query: 'What does Islam say about gratitude and thankfulness?', emoji: '🌟' },
  { id: 'parents', label: 'Parents', query: 'What does Islam say about respecting and honoring parents?', emoji: '👨‍👩‍👧' },
  { id: 'marriage', label: 'Marriage', query: 'What does Islam say about marriage?', emoji: '💍' },
  { id: 'halal', label: 'Halal Food', query: 'What does Islam say about halal food and dietary laws?', emoji: '🥩' },
  { id: 'charity', label: 'Charity', query: 'What does Islam say about charity and sadaqah?', emoji: '💝' },
  { id: 'knowledge', label: 'Knowledge', query: 'What does Islam say about seeking knowledge?', emoji: '📚' },
  { id: 'character', label: 'Character', query: 'What does Islam say about good character and manners?', emoji: '✨' },
];
