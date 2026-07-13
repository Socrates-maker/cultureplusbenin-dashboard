export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'email'
  | 'password'
  | 'url'
  | 'select'
  | 'reference'
  | 'polymorphic'
  | 'location'
  | 'switch'
  | 'tags';

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Static options for `select`. */
  options?: SelectOption[];
  /** For `reference`: REST path + how to label/value each row. */
  reference?: {
    path: string;
    labelKey: string;
    valueKey?: string; // defaults to _id
  };
  /**
   * For `polymorphic`: the field name whose value picks the collection to load.
   * `sources` maps that value to a REST path + label.
   */
  polymorphic?: {
    dependsOn: string;
    sources: Record<string, { path: string; labelKey: string }>;
  };
  /**
   * For `tags`: REST base path of the resource whose `/tags` route feeds
   * autocomplete suggestions.
   */
  tagSource?: string;
  /** Only show the field when creating (not editing). */
  createOnly?: boolean;
  defaultValue?: unknown;
}
