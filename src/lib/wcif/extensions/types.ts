/**
 * Extension type that matches WCIF specification
 */
export interface Extension {
  id: string;
  specUrl: string;
  data: object;
}

/**
 * Base interface for WCIF entities that can have extensions
 */
export interface WcifEntity {
  extensions: Extension[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
