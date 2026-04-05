-- Tabla principal de citas (fuente de verdad)
CREATE TABLE citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cliente UUID NOT NULL REFERENCES configuracion_maestra(id_cliente),

  -- Datos de la cita (vienen del agendamiento)
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  dia TEXT, -- "Lunes", "Martes", etc.
  modalidad TEXT DEFAULT 'Presencial', -- 'Presencial' | 'Videollamada'
  status_cita TEXT NOT NULL DEFAULT 'Agendado', -- 'Agendado' | 'Confirmado' | 'Por Confirmar' | 'Cancelado' | 'Reagendado'

  -- Datos del paciente
  nombre_paciente TEXT NOT NULL,
  apellidos_paciente TEXT,
  telefono TEXT NOT NULL,
  status_paciente TEXT, -- 'Nuevo' | 'Recurrente'

  -- Campos que llena el terapeuta desde la app (nullable = pendiente de revisión)
  asistencia TEXT, -- NULL (pendiente) | 'Presente' | 'Falta'
  pago TEXT, -- NULL (pendiente) | 'Consulta Individual' | 'Consulta Pareja' | 'Adeudo' | 'Cortesía'
  monto_adeudo NUMERIC DEFAULT 0,

  -- Seguimiento (lo actualiza n8n después del webhook)
  seguimiento_noshow TEXT, -- NULL | 'Seguimiento' | 'Completado'
  seguimiento_adeudo TEXT, -- NULL | 'Pendiente' | 'Cobrado'
  ingreso NUMERIC DEFAULT 0, -- Monto registrado como ingreso

  -- Referencia al ID de la cita en Google Sheets
  id_cita_externo TEXT, -- El "ID Cita" que ya se usa en la Bitacora

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_citas_cliente_fecha ON citas(id_cliente, fecha DESC);
CREATE INDEX idx_citas_pendientes ON citas(id_cliente, fecha) WHERE asistencia IS NULL;
CREATE INDEX idx_citas_telefono ON citas(telefono);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citas_updated_at
  BEFORE UPDATE ON citas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS: cada terapeuta solo ve sus propias citas
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own citas"
  ON citas FOR SELECT
  USING (id_cliente IN (
    SELECT id_cliente FROM configuracion_maestra WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own citas"
  ON citas FOR UPDATE
  USING (id_cliente IN (
    SELECT id_cliente FROM configuracion_maestra WHERE user_id = auth.uid()
  ));
