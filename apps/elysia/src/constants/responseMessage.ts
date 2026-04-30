export const responseMessage = (label: string) => {
  const normalizeLabel = (label: string) => label.trim().toLowerCase();
  const l = normalizeLabel(label);

  return {
    alreadyExists: `${l} already exists`,
    created: `${l} created successfully`,
    deleted: `${l} deleted successfully`,
    expired: `${l} is expired`,
    invalid: `${l} is invalid`,
    notFound: `${l} not found`,
    required: `${l} is required`,
    retrieved: `${l} data retrieved successfully`,
    success: `${l} success`,
    updated: `${l} updated successfully`,
  };
};
