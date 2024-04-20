-- AlterTable
CREATE SEQUENCE tempsesion_id_seq;
ALTER TABLE "TempSesion" ALTER COLUMN "id" SET DEFAULT nextval('tempsesion_id_seq');
ALTER SEQUENCE tempsesion_id_seq OWNED BY "TempSesion"."id";
