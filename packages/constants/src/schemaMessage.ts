const formatLabel = (label: string) => label.trim().toLowerCase();

export const schemaMessage = {
  number: {
    int: (label: string) => `${formatLabel(label)} must be an integer`,
    max: (label: string, max: number) => `${formatLabel(label)} must be at most ${max}`,
    min: (label: string, min: number) => `${formatLabel(label)} must be at least ${min}`,
    positive: (label: string) => `${formatLabel(label)} must be greater than 0`,
  },
  string: {
    email: (label: string) => `${formatLabel(label)} must be a valid email address`,
    enum: (label: string) => `${formatLabel(label)} is required`,
    max: (label: string, max: number) => `${formatLabel(label)} must be at most ${max} characters`,
    min: (label: string, min: number) => `${formatLabel(label)} must be at least ${min} characters`,
    required: (label: string) => `${formatLabel(label)} is required`,
    startsWith: (label: string, value: string) => `${formatLabel(label)} must start with ${value}`,
    url: (label: string) => `${formatLabel(label)} must be a valid URL`,
  },
};
