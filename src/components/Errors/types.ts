export interface WCIFError {
  type: string;
  key: string;
  message: string;
  data: any;
}

export interface ErrorsProps {
  errors: WCIFError[];
}
