﻿/*
 * Copyright (c) 2016 David Sehnal, licensed under Apache 2.0, See LICENSE file for more info.
 */

namespace LiteMol.Core.Structure {
    "use strict";

    import DataTable = Utils.DataTable
    
    export interface Position {
        x: number,
        y: number,
        z: number
    }

    export interface Atom {
        id: number,
        name: string,
        authName: string,
        elementSymbol: string,
        altLoc: string | null,
        occupancy: number,
        tempFactor: number,
        residueIndex: number,
        chainIndex: number,
        entityIndex: number,
        rowIndex: number
    }

    export interface Residue {
        name: string,
        seqNumber: number,
        asymId: string,
        authName: string,
        authSeqNumber: number,
        authAsymId: string,
        insCode: string | null,
        entityId: string,

        isHet: number,

        atomStartIndex: number,
        atomEndIndex: number,

        chainIndex: number,
        entityIndex: number,

        secondaryStructureIndex: number
    }

    export interface Chain {
        asymId: string,
        authAsymId: string,
        entityId: string,

        atomStartIndex: number,
        atomEndIndex: number,
        residueStartIndex: number,
        residueEndIndex: number,

        entityIndex: number,

        // used by computed molecules (symmetry, assembly)
        sourceChainIndex: number,
        operatorIndex: number
    }

    export interface Entity {
        entityId: string,

        atomStartIndex: number,
        atomEndIndex: number,
        residueStartIndex: number,
        residueEndIndex: number,
        chainStartIndex: number,
        chainEndIndex: number,
        type: Entity.Type
    }

    export namespace Entity {
        export type Type = 'polymer' | 'non-polymer' | 'water' | 'unknown'
    }

    export interface Bond {
        atomAIndex: number,
        atomBIndex: number,
        type: Bond.Type
    }

    export namespace Bond {
        export const enum Type {
            Unknown = 0,

            Single = 1,
            Double = 2,
            Triple = 3,
            Aromatic = 4,

            Metallic = 5,
            Ion = 6,
            Hydrogen = 7,
            DisulfideBridge = 8
        }
    }

    export class ComponentBondInfoEntry {

        map: Map<string, Map<string, Bond.Type>> = new Map<string, Map<string, Bond.Type>>();

        add(a: string, b: string, order: Bond.Type, swap = true) {

            let e = this.map.get(a);
            if (e !== void 0) {
                let f = e.get(b);
                if (f === void 0) {
                    e.set(b, order);
                }
            } else {
                let map = new Map<string, Bond.Type>();
                map.set(b, order);
                this.map.set(a, map);
            }

            if (swap) this.add(b, a, order, false);
        }

        constructor(public id: string) {
        }
    }

    export class ComponentBondInfo {
        entries: Map<string, ComponentBondInfoEntry> = new Map<string, ComponentBondInfoEntry>();

        newEntry(id: string) {
            let e = new ComponentBondInfoEntry(id);
            this.entries.set(id, e);
            return e;
        }
    }

    /**
     * Identifier for a reside that is a part of the polymer.
     */
    export class PolyResidueIdentifier {
        constructor(public asymId: string, public seqNumber: number, public insCode: string | null) { }


        static areEqual(a: PolyResidueIdentifier, index: number, bAsymId: string[], bSeqNumber: number[], bInsCode: string[]) {
            return a.asymId === bAsymId[index]
                && a.seqNumber === bSeqNumber[index]
                && a.insCode === bInsCode[index];
        }

        static compare(a: PolyResidueIdentifier, b: PolyResidueIdentifier) {
            if (a.asymId === b.asymId) {
                if (a.seqNumber === b.seqNumber) {
                    if (a.insCode === b.insCode) return 0;
                    if (a.insCode === void 0) return -1;
                    if (b.insCode === void 0) return 1;
                    return a.insCode < b.insCode ? -1 : 1;
                }
                return a.seqNumber < b.seqNumber ? -1 : 1;
            }
            return a.asymId < b.asymId ? -1 : 1;
        }

        static compareResidue(a: PolyResidueIdentifier, index: number, bAsymId: string[], bSeqNumber: number[], bInsCode: string[]) {
            if (a.asymId === bAsymId[index]) {
                if (a.seqNumber === bSeqNumber[index]) {
                    if (a.insCode === bInsCode[index]) return 0;
                    if (a.insCode === void 0) return -1;
                    if (bInsCode[index] === void 0) return 1;
                    return a.insCode < bInsCode[index] ? -1 : 1;
                }
                return a.seqNumber < bSeqNumber[index] ? -1 : 1;
            }
            return a.asymId < bAsymId[index] ? -1 : 1;
        }
    }

    export const enum SecondaryStructureType { None = 0, Helix = 1, Turn = 2, Sheet = 3, AminoSeq = 4, Strand = 5 }

    export class SecondaryStructureElement {

        startResidueIndex: number = -1;
        endResidueIndex: number = -1;

        get length() {
            return this.endResidueIndex - this.startResidueIndex;
        }

        constructor(
            public type: SecondaryStructureType,
            public startResidueId: PolyResidueIdentifier,
            public endResidueId: PolyResidueIdentifier,
            public info: any = {}) {
        }
    }

    export class SymmetryInfo {
        constructor(
            public spacegroupName: string,
            public cellSize: number[],
            public cellAngles: number[],
            public toFracTransform: number[],
            public isNonStandardCrytalFrame: boolean) {
        }
    }

    /**
     * Wraps an assembly operator.
     */
    export class AssemblyOperator { constructor(public id: string, public name: string, public operator: number[]) { } }

    /**
     * Wraps a single assembly gen entry.
     */
    export class AssemblyGenEntry {
        constructor(public operators: string[][], public asymIds: string[]) { }
    }

    /**
     * Wraps an assembly generation template.
     */
    export class AssemblyGen {
        gens: AssemblyGenEntry[] = [];
        constructor(public name: string) { }
    }

    /**
     * Information about the assemblies.
     */
    export class AssemblyInfo {
        constructor(public operators: { [id: string]: AssemblyOperator }, public assemblies: AssemblyGen[]) {
        }
    }

    export type PositionTable = DataTable<Position>
    export type AtomTable = DataTable<Atom>
    export type ResidueTable = DataTable<Residue>
    export type ChainTable = DataTable<Chain>
    export type EntityTable = DataTable<Entity>
    export type BondTable = DataTable<Bond>

    /**
     * Default Builders
     */
    export namespace Tables {

        export function positions(count: number) {
            let builder = DataTable.builder<Position>(count);
            let columns = {
                x: builder.addColumn('x', size => new Float32Array(size)),
                y: builder.addColumn('y', size => new Float32Array(size)),
                z: builder.addColumn('z', size => new Float32Array(size))
            }
            return { table: builder.seal(), columns };
        }


        export function atoms(count: number) {
            let builder = DataTable.builder<Atom>(count);
            let columns = {
                id: builder.addColumn('id', size => new Int32Array(size)),
                altLoc: builder.addColumn('altLoc', size => []),
                residueIndex: builder.addColumn('residueIndex', size => new Int32Array(size)),
                chainIndex: builder.addColumn('chainIndex', size => new Int32Array(size)),
                entityIndex: builder.addColumn('entityIndex', size => new Int32Array(size)),
                name: <string[]>builder.addColumn('name', size => []),
                elementSymbol: <string[]>builder.addColumn('elementSymbol', size => []),
                occupancy: builder.addColumn('occupancy', size => new Float32Array(size)),
                tempFactor: builder.addColumn('tempFactor', size => new Float32Array(size)),
                authName: <string[]>builder.addColumn('authName', size => []),
                rowIndex: builder.addColumn('rowIndex', size => new Int32Array(size)),
            }
            return { table: builder.seal(), columns };
        }

        export function residues(count: number) {
            let builder = DataTable.builder<Residue>(count);
            let columns = {
                name: builder.addColumn('name', size => <string[]>[]),
                seqNumber: builder.addColumn('seqNumber', size => new Int32Array(size)),
                asymId: builder.addColumn('asymId', size => <string[]>[]),
                authName: builder.addColumn('authName', size => <string[]>[]),
                authSeqNumber: builder.addColumn('authSeqNumber', size => new Int32Array(size)),
                authAsymId: builder.addColumn('authAsymId', size => <string[]>[]),
                insCode: builder.addColumn('insCode', size => <(string | null)[]>[]),
                entityId: builder.addColumn('entityId', size => <string[]>[]),
                isHet: builder.addColumn('isHet', size => new Int8Array(size)),
                atomStartIndex: builder.addColumn('atomStartIndex', size => new Int32Array(size)),
                atomEndIndex: builder.addColumn('atomEndIndex', size => new Int32Array(size)),
                chainIndex: builder.addColumn('chainIndex', size => new Int32Array(size)),
                entityIndex: builder.addColumn('entityIndex', size => new Int32Array(size)),
                secondaryStructureIndex: builder.addColumn('secondaryStructureIndex', size => new Int32Array(size)),
            }
            return { table: builder.seal(), columns };
        }

        export function chains(count: number) {
            let builder = DataTable.builder<Chain>(count);
            let columns = {
                asymId: builder.addColumn('asymId', size => <string[]>[]),
                entityId: builder.addColumn('entityId', size => <string[]>[]),
                authAsymId: builder.addColumn('authAsymId', size => <string[]>[]),
                atomStartIndex: builder.addColumn('atomStartIndex', size => new Int32Array(size)),
                atomEndIndex: builder.addColumn('atomEndIndex', size => new Int32Array(size)),
                residueStartIndex: builder.addColumn('residueStartIndex', size => new Int32Array(size)),
                residueEndIndex: builder.addColumn('residueEndIndex', size => new Int32Array(size)),
                entityIndex: builder.addColumn('entityIndex', size => new Int32Array(size)),
            }
            return { table: builder.seal(), columns };
        }

        export function entities(count: number) {
            let builder = DataTable.builder<Entity>(count);
            let columns = {
                entityId: builder.addColumn('entityId', size => <string[]>[]),
                type: builder.addColumn('type', size => <string[]>[]),
                atomStartIndex: builder.addColumn('atomStartIndex', size => new Int32Array(size)),
                atomEndIndex: builder.addColumn('atomEndIndex', size => new Int32Array(size)),
                residueStartIndex: builder.addColumn('residueStartIndex', size => new Int32Array(size)),
                residueEndIndex: builder.addColumn('residueEndIndex', size => new Int32Array(size)),
                chainStartIndex: builder.addColumn('chainStartIndex', size => new Int32Array(size)),
                chainEndIndex: builder.addColumn('chainEndIndex', size => new Int32Array(size))
            }
            return { table: builder.seal(), columns };
        }

        export function bonds(count: number) {
            let builder = DataTable.builder<Bond>(count);
            let columns = {
                atomAIndex: builder.addColumn('atomAIndex', size => new Int32Array(size)),
                atomBIndex: builder.addColumn('atomBIndex', size => new Int32Array(size)),
                type: builder.addColumn('type', size => new Int8Array(size))
            }
            return { table: builder.seal(), columns };
        }

    }

    export class Operator {
        apply(v: Geometry.LinearAlgebra.ObjectVec3) {
            Geometry.LinearAlgebra.Matrix4.transformVector3(v, v, this.matrix)
        }

        static applyToModelUnsafe(matrix: number[], m: Molecule.Model) {
            let v = { x: 0.1, y: 0.1, z: 0.1 };
            let {x, y, z} = m.positions;
            for (let i = 0, _b = m.positions.count; i < _b; i++) {
                v.x = x[i]; v.y = y[i]; v.z = z[i];
                Geometry.LinearAlgebra.Matrix4.transformVector3(v, v, matrix);
                x[i] = v.x; y[i] = v.y; z[i] = v.z;
            }
        }

        constructor(public matrix: number[], public id: string, public isIdentity: boolean) {

        }
    }

    export interface Molecule {
        readonly properties: Molecule.Properties,
        readonly id: string,
        readonly models: Molecule.Model[]
    }

    export namespace Molecule {
        export function create(id: string, models: Model[], properties: Properties = {}): Molecule {
            return { id, models, properties };
        }
        
        export interface Properties {
            experimentMethod?: string
        }

        export interface Bonds {
            covalent?: BondTable,
            nonCovalent?: BondTable,
            computed?: BondTable
            readonly component?: ComponentBondInfo,
        }
        
        export interface Model extends Model.Base {
            readonly queryContext: Query.Context
        }

        export namespace Model {
            export function create(model: Base): Model {
                let ret = Utils.extend({}, model);
                let queryContext: Query.Context | undefined = void 0
                Object.defineProperty(ret, 'queryContext', { enumerable: true, configurable: false, get: function() { 
                    if (queryContext) return queryContext;
                    queryContext = Query.Context.ofStructure(ret as Model);
                    return queryContext;
                }});
                return ret as Model;
            }

            export enum Source {
                File,
                Computed
            }

            export interface Base {
                readonly id: string,
                readonly modelId: string,

                readonly positions: PositionTable,
                readonly data: Data,
                
                readonly source: Source,
                readonly parent?: Model,
                readonly operators?: Operator[],
            }

            export interface Data {
                readonly atoms: AtomTable,
                readonly residues: ResidueTable,
                readonly chains: ChainTable,
                readonly entities: EntityTable,
                readonly bonds: Bonds,
                readonly secondaryStructure: SecondaryStructureElement[],
                readonly symmetryInfo?: SymmetryInfo,
                readonly assemblyInfo?: AssemblyInfo,
            }

            export function withTransformedXYZ<T>(
                model: Model, ctx: T, 
                transform: (ctx: T, x: number, y: number, z: number, out: Geometry.LinearAlgebra.ObjectVec3) => void) {

                let {x,y,z} = model.positions;
                let tAtoms = model.positions.getBuilder(model.positions.count).seal();
                let {x:tX, y:tY, z:tZ} = tAtoms;
                let t = { x: 0.0, y: 0.0, z: 0.0 };

                for (let i = 0, _l = model.positions.count; i < _l; i++) {
                    transform(ctx, x[i], y[i], z[i], t);
                    tX[i] = t.x;
                    tY[i] = t.y;
                    tZ[i] = t.z;
                }

                return create({
                    id: model.id,
                    modelId: model.modelId,
                    data: model.data, 
                    positions: tAtoms,
                    parent: model.parent,
                    source: model.source,
                    operators: model.operators
                });
            }
        }
    }
}