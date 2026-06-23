export const P2003 = (meta: Record<string, unknown> | undefined): string => {
  const field = meta?.field_name as string | undefined;
  return (
    field
      ?.replaceAll("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "[failed to extract field name from error meta]"
  );
};

export const P2002 = (message: string): string => {
  const split = message.split("\n");
  const lastLine = split.at(-1);
  const field = lastLine?.match(/`([^`]+)`/)?.[1];
  return (
    field
      ?.replaceAll("_", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "[failed to extract field name from error message]"
  );
};
