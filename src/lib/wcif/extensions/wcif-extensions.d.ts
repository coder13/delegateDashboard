// augment extensions module to make `data` generic

declare module '@wca/helpers/lib/models/extension' {
  export interface Extension<T = object> {
    data: T;
    id: string;
    specUrl: string;
  }
}
