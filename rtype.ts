type IntBitSize = 8 | 16 | 32 | 64 | 128 | 'size'
type FloatBitSize = 16 | 32 | 64

// layout: 1. primitive 2. sum type, 3. product type, 4. collection type
// primitive type: u8, i8, u16, i16, u32, i32, u64, i64, f32, f64, bool, String
// sum type: enum
// product type: struct, tuple, array
// collection type: vec, set, map, ...etc

export type Layout = 'sum' | 'product' | 'collection'




export type RustType = PrimitiveType | StructType | TupleType | ArrayType | EnumType | CollectionType | UnitType
export type UnitType = 'unit'
export type PrimitiveType = `u${IntBitSize}` | `i${IntBitSize}` | `f${FloatBitSize}` | 'bool' | 'String'

export const SYMBOL_LAYOUT: unique symbol = Symbol('layout')
export const SYMBOL_SLICE: unique symbol = Symbol('slice')

export type EnumLayout = {
    [SYMBOL_LAYOUT]: 'enum'
}
export type CollectionType = {
    [SYMBOL_LAYOUT]: 'collection'
    type: RustType
}

export type StructDefinition = {
    [key: string]: RustType
}

export type StructType = StructDefinition & {
    [SYMBOL_LAYOUT]: 'struct'
}

export type TupleLayout = {
    [SYMBOL_LAYOUT]: 'tuple'
}
export type TupleType = RustType[] & TupleLayout
export type ArrayLayout = {
    [SYMBOL_LAYOUT]: 'array'
}
export type ArrayType = {
    type: RustType
    length: number
} & ArrayLayout

export type EnumVariantKind = UnitType | TupleType | StructType

export type EnumVariant = {
    variant: number,
    kind: EnumVariantKind
}

export type EnumDefinition = {
    [key: number]: EnumVariantKind
}

export type EnumType = {
    [key: number]: EnumVariantKind
} & EnumLayout


export function struct(definition: StructDefinition): StructType {
    let definitionAsStruct = definition as StructType
    definitionAsStruct[SYMBOL_LAYOUT] = 'struct'
    return definitionAsStruct
}

export function tuple(...types: RustType[]): TupleType {
    let typesAsTuple = types as TupleType
    typesAsTuple[SYMBOL_LAYOUT] = 'tuple'
    return typesAsTuple
}

export function enumerate(definition: EnumDefinition): EnumType {
    let definitionAsStruct = definition as EnumType
    definitionAsStruct[SYMBOL_LAYOUT] = 'enum'
    return definitionAsStruct
}

export function variant(variant: number, kind?: EnumVariantKind): EnumVariant {
    return { variant, kind: kind ?? 'unit' }
}

export type Array<T extends RustType, N extends number> = {
    type: T
    length: N
} & ArrayLayout
export function array(type: RustType, length: number): ArrayType {
    return { [SYMBOL_LAYOUT]: 'array', type, length }
}

export function collection(type: RustType): CollectionType {
    return { [SYMBOL_LAYOUT]: 'collection', type }
}

export const vec = collection;
export const set = collection;
export const map = (k: RustType, v: RustType) => collection(tuple(k, v));
export const SOME = 1;
export const NONE = 0;
export const OK = 1;
export const ERROR = 0;
export type Tuple<Types extends RustType[]> = Types & TupleLayout;
export type OptionType<T extends RustType> = {
    [SOME]: Tuple<[T]>
    [NONE]: UnitType
} & EnumLayout

export const option = (t: RustType): EnumType => enumerate(
    {
        [SOME]: tuple(t),
        [NONE]: 'unit'
    }
)

export const result = (t: RustType, e: RustType): EnumType => enumerate(
    {
        [OK]: tuple(t),
        [ERROR]: tuple(e)
    }
)

export type Slice = {
    from: number
    to: number
}
export type SlicePart = {
    [SYMBOL_SLICE]: Slice
}

export type StructValue<T extends StructType> = {
    [K in Exclude<keyof T, typeof SYMBOL_LAYOUT>]: T[K] extends RustType ? RustValue<T[K]> : never
} & SlicePart

export type EnumValue<T extends EnumType> = {
    [K in keyof T]: T[K] extends RustType ? {
        variant: K
        value: RustValue<T[K]>
    } : never
}[keyof T] & SlicePart


type DeTupleLayout<T> = T extends (infer U & TupleLayout) ? U : T;
type MapTupleValue<T extends unknown[]> = T extends
    [infer U, ...infer R] ? U extends RustType ? [RustValue<U>, ...MapTupleValue<R>] : never :
    T extends [] ? [] : never

export type TupleValue<T extends TupleType> = MapTupleValue<DeTupleLayout<T>> & SlicePart

export type PrimitiveValue<T extends PrimitiveType> = {
    type: T,
} & SlicePart

export type collectionValue<T extends CollectionType> = RustValue<T['type']>[] & SlicePart


export type ArrayValue<T extends ArrayType> = RustValue<T['type']>[] & {
    length: T['length']
} & SlicePart

export type RustValue<T extends RustType> =
    T extends StructType ? StructValue<T> :
    T extends EnumType ? EnumValue<T> :
    T extends TupleType ? TupleValue<T> :
    T extends ArrayType ? ArrayValue<T> :
    T extends CollectionType ? collectionValue<T> :
    T extends PrimitiveType ? PrimitiveValue<T> :
    never

type X = RustValue<OptionType<'u64'>>;
type Y = RustValue<Tuple<['u64']>>;
type Z = RustValue<Array<'u64', 3>>;