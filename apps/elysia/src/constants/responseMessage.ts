export const responseMessage = (label: string) => {
  const lowerCase = (label: string) => label.trim().toLowerCase();
  const result = lowerCase(label);

  return {
    alreadyExists: `${result} already exists`,
    created: `${result} created successfully`,
    deleted: `${result} deleted successfully`,
    expired: `${result} is expired`,
    invalid: `${result} is invalid`,
    notFound: `${result} not found`,
    required: `${result} is required`,
    retrieved: `${result} data retrieved successfully`,
    success: `${result} success`,
    updated: `${result} updated successfully`,
  };
};
