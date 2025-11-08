/**
 * Utility functions for managing table context throughout the application
 */

export interface TableContext {
  tableId: string;
  isValid: boolean;
}

/**
 * Validates if a table ID is in the correct format
 */
export const validateTableId = (tableId: string | undefined): boolean => {
  if (!tableId) return false;
  
  // Table ID should be alphanumeric and between 1-20 characters
  // Allow numbers, letters, and common table formats like "A1", "Mesa1", etc.
  const tableIdRegex = /^[a-zA-Z0-9]{1,20}$/;
  return tableIdRegex.test(tableId.trim());
};

/**
 * Gets the current table ID from localStorage
 */
export const getCurrentTableId = (): string | null => {
  return localStorage.getItem("currentTableId");
};

/**
 * Sets the current table ID in localStorage
 */
export const setCurrentTableId = (tableId: string): void => {
  if (validateTableId(tableId)) {
    localStorage.setItem("currentTableId", tableId);
  }
};

/**
 * Clears the current table ID from localStorage
 */
export const clearCurrentTableId = (): void => {
  localStorage.removeItem("currentTableId");
};

/**
 * Gets table context with validation
 */
export const getTableContext = (tableId?: string): TableContext => {
  const currentTableId = tableId || getCurrentTableId();
  
  return {
    tableId: currentTableId || "",
    isValid: validateTableId(currentTableId)
  };
};

/**
 * Formats table ID for display (e.g., "1" -> "Mesa 1", "A1" -> "Mesa A1")
 */
export const formatTableDisplay = (tableId: string): string => {
  if (!tableId) return "";
  
  // Clean the table ID
  const cleanId = tableId.trim();
  
  // If it already starts with "Mesa", just capitalize properly
  if (cleanId.toLowerCase().startsWith("mesa")) {
    return cleanId.charAt(0).toUpperCase() + cleanId.slice(1).toLowerCase().replace(/mesa\s*/, "Mesa ");
  }
  
  // Otherwise, prepend "Mesa "
  return `Mesa ${cleanId.toUpperCase()}`;
};