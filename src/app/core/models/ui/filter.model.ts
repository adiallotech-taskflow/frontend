export interface FilterTag {
  type: 'status' | 'priority' | 'assignee' | 'team' | 'time';
  value: string;
  label: string;
  color?: string;
}

export interface FilterSuggestion {
  type: FilterTag['type'];
  value: string;
  label: string;
  hint?: string;
}