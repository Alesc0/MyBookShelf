export type OLBook_Search = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  editions: {
    docs?: [
      {
        key: string;
        title: string;
        cover_i?: string;
      }
    ];
  };
};
