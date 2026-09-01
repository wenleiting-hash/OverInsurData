/// <reference types="vite/client" />

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: {
        actions: {
          add: string;
          edit: string;
          delete: string;
          save: string;
          cancel: string;
          confirm: string;
          reset: string;
          download: string;
          export: string;
          import: string;
          view: string;
          search: string;
          filter: string;
        };
        status: {
          active: string;
          inactive: string;
          pending: string;
          approved: string;
          rejected: string;
          suspended: string;
        };
      };
    };
  }
}
