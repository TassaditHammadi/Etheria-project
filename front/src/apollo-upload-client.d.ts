declare module "apollo-upload-client" {
  import { ApolloLink } from "@apollo/client/core";

  export interface UploadOptions {
    uri?: string;
    fetch?: GlobalFetch["fetch"];
    headers?: Record<string, string>;
    credentials?: string;
  }

  export function createUploadLink(options?: UploadOptions): ApolloLink;
}
