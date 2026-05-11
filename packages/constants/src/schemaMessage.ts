const lowerCase = (label: string) => label.trim().toLowerCase();

export const schemaMessage = {
  number: {
    int: (label: string) => `${lowerCase(label)} must be an integer`,
    max: (label: string, max: number) => `${lowerCase(label)} must be at most ${max}`,
    min: (label: string, min: number) => `${lowerCase(label)} must be at least ${min}`,
    positive: (label: string) => `${lowerCase(label)} must be greater than 0`,
  },
  string: {
    email: (label: string) => `${lowerCase(label)} must be a valid email address`,
    enum: (label: string) => `${lowerCase(label)} is required`,
    max: (label: string, max: number) => `${lowerCase(label)} must be at most ${max} characters`,
    min: (label: string, min: number) => `${lowerCase(label)} must be at least ${min} characters`,
    required: (label: string) => `${lowerCase(label)} is required`,
    startsWith: (label: string, value: string) => `${lowerCase(label)} must start with ${value}`,
    url: (label: string) => `${lowerCase(label)} must be a valid URL`,
    uuid: (label: string) => `${lowerCase(label)} must be a valid UUID`,
  },
};
