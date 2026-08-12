/** One entry in user.access */
export interface AccessEntry {
  access_to: string;          // Parent module title
  functionalities: string[];  // Allowed child titles
}

/** The user object shape used throughout access control */
export interface AccessUser {
  role: string;
  access?: AccessEntry[];     // Structured permissions
}

/**
 * Example user.access value:
 * [
 *   { access_to: "Dashboard",         functionalities: ["Overview", "Statistics"] },
 *   { access_to: "Zonal ICT Support", functionalities: ["User Support", "System Logs"] },
 *   { access_to: "Finance",           functionalities: ["Payments", "Reporting"] },
 * ]
 */
