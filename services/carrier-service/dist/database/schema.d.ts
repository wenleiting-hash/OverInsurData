export declare const insuranceCarrier: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "insurance_carrier";
    schema: undefined;
    columns: {
        carrierId: import("drizzle-orm/pg-core").PgColumn<{
            name: "carrier_id";
            tableName: "insurance_carrier";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        carrierName: import("drizzle-orm/pg-core").PgColumn<{
            name: "carrier_name";
            tableName: "insurance_carrier";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        naicCode: import("drizzle-orm/pg-core").PgColumn<{
            name: "naic_code";
            tableName: "insurance_carrier";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        type: import("drizzle-orm/pg-core").PgColumn<{
            name: "type";
            tableName: "insurance_carrier";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        rating: import("drizzle-orm/pg-core").PgColumn<{
            name: "rating";
            tableName: "insurance_carrier";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "insurance_carrier";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, {}, {}>;
        contactInfo: import("drizzle-orm/pg-core").PgColumn<{
            name: "contact_info";
            tableName: "insurance_carrier";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                address?: string;
                phone?: string;
                email?: string;
            };
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        settlementConfig: import("drizzle-orm/pg-core").PgColumn<{
            name: "settlement_config";
            tableName: "insurance_carrier";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                currency?: string;
                paymentTermDays?: number;
            };
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "insurance_carrier";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "insurance_carrier";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export type InsuranceCarrier = typeof insuranceCarrier.$inferSelect;
export type NewInsuranceCarrier = typeof insuranceCarrier.$inferInsert;
