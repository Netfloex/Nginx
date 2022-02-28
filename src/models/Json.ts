type Literal = string | number | boolean;
export type Json = Literal | { [key: string]: Json } | Json[];
