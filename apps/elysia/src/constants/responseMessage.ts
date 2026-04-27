export const responseMessage = (label: string) => ({
  alreadyExists: `${label} already exists`,
  created: `${label} created successfully`,
  deleted: `${label} deleted successfully`,
  expired: `${label} is expired`,
  invalid: `${label} is invalid`,
  notFound: `${label} not found`,
  required: `${label} is required`,
  retrieved: `${label} data retrieved successfully`,
  success: `${label} success`,
  updated: `${label} updated successfully`,
});
