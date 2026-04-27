export const P2003 = (meta: Record<string, unknown> | undefined): string => {
  const field = meta?.field_name as string | undefined;
  return (
    field
      ?.replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "[Failed to extract field name from error meta]"
  );
};

export const P2002 = (message: string): string => {
  const split = message.split("\n");
  const lastLine = split[split.length - 1];
  const field = lastLine.match(/`([^`]+)`/)?.[1];
  return (
    field
      ?.replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "[Failed to extract field name from error message]"
  );
};
