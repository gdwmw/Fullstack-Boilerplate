export const schemaMessage = {
  number: {
    int: (label: string) => `${label.trim()} must be an integer`.toLowerCase(),
    max: (label: string, max: number) => `${label.trim()} maximum ${max}`.toLowerCase(),
    min: (label: string, min: number) => `${label.trim()} minimum ${min}`.toLowerCase(),
    positive: (label: string) => `${label.trim()} must be greater than 0`.toLowerCase(),
  },
  string: {
    email: (label: string) => `${label.trim()} must be a valid email address`.toLowerCase(),
    enum: (label: string) => `please select ${label.trim()}`.toLowerCase(),
    max: (label: string, max: number) => `${label.trim()} maximum ${max} characters`.toLowerCase(),
    min: (label: string, min: number) => `please enter ${label.trim()} minimum ${min} characters`.toLowerCase(),
    required: (label: string) => `please enter ${label.trim()}`.toLowerCase(),
    startsWith: (label: string, value: string) => `${label.trim()} must start with ${value}`.toLowerCase(),
    url: (label: string) => `${label.trim()} must be a valid url`.toLowerCase(),
  },
};
