-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.empresas (
  id bigint NOT NULL DEFAULT nextval('empresas_id_seq'::regclass),
  nombre character varying NOT NULL CHECK (nombre::text <> ''::text),
  logo character varying,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT empresas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sucursales (
  id bigint NOT NULL DEFAULT nextval('sucursales_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  nombre character varying NOT NULL,
  direccion character varying NOT NULL,
  telefono character varying NOT NULL,
  email character varying,
  horarios character varying,
  mapa_incrustado text,
  latitud numeric,
  longitud numeric,
  es_principal boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sucursales_pkey PRIMARY KEY (id),
  CONSTRAINT sucursales_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.productos (
  id bigint NOT NULL DEFAULT nextval('productos_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  nombre character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  imagen character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT productos_pkey PRIMARY KEY (id),
  CONSTRAINT productos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.categorias (
  id bigint NOT NULL DEFAULT nextval('categorias_id_seq'::regclass),
  producto_id bigint NOT NULL,
  nombre character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  imagen character varying,
  descripcion text,
  descripcion_corta text,
  uso character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categorias_pkey PRIMARY KEY (id),
  CONSTRAINT categorias_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.marcas (
  id bigint NOT NULL DEFAULT nextval('marcas_id_seq'::regclass),
  nombre character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  logo character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT marcas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.producto_marca (
  id bigint NOT NULL DEFAULT nextval('producto_marca_id_seq'::regclass),
  producto_id bigint NOT NULL,
  marca_id bigint NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT producto_marca_pkey PRIMARY KEY (id),
  CONSTRAINT producto_marca_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT producto_marca_marca_id_fkey FOREIGN KEY (marca_id) REFERENCES public.marcas(id)
);
CREATE TABLE public.tipo_atributo (
  id bigint NOT NULL DEFAULT nextval('tipo_atributo_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  descripcion text,
  permite_descripcion boolean NOT NULL DEFAULT false,
  permite_valor_numerico boolean NOT NULL DEFAULT false,
  permite_unidad_medida boolean NOT NULL DEFAULT false,
  icono character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipo_atributo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.atributos_tecnico (
  id bigint NOT NULL DEFAULT nextval('atributos_tecnico_id_seq'::regclass),
  tipo_atributo_id bigint NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  valor_numerico numeric,
  unidad_medida character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT atributos_tecnico_pkey PRIMARY KEY (id),
  CONSTRAINT atributos_tecnico_tipo_atributo_id_fkey FOREIGN KEY (tipo_atributo_id) REFERENCES public.tipo_atributo(id)
);
CREATE TABLE public.categoria_atributo (
  id bigint NOT NULL DEFAULT nextval('categoria_atributo_id_seq'::regclass),
  categoria_id bigint NOT NULL,
  atributo_id bigint NOT NULL,
  valor_personalizado numeric,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categoria_atributo_pkey PRIMARY KEY (id),
  CONSTRAINT categoria_atributo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id),
  CONSTRAINT categoria_atributo_atributo_id_fkey FOREIGN KEY (atributo_id) REFERENCES public.atributos_tecnico(id)
);
CREATE TABLE public.industrias (
  id bigint NOT NULL DEFAULT nextval('industrias_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  nombre character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  imagen character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT industrias_pkey PRIMARY KEY (id),
  CONSTRAINT industrias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.servicios (
  id bigint NOT NULL DEFAULT nextval('servicios_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  nombre character varying NOT NULL,
  descripcion text,
  imagen character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT servicios_pkey PRIMARY KEY (id),
  CONSTRAINT servicios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.industria_asignacion (
  id bigint NOT NULL DEFAULT nextval('industria_asignacion_id_seq'::regclass),
  industria_id bigint NOT NULL,
  tipo_registro character varying NOT NULL CHECK (tipo_registro::text = ANY (ARRAY['categoria'::character varying, 'servicio'::character varying]::text[])),
  registro_id bigint NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT industria_asignacion_pkey PRIMARY KEY (id),
  CONSTRAINT industria_asignacion_industria_id_fkey FOREIGN KEY (industria_id) REFERENCES public.industrias(id)
);
CREATE TABLE public.tipo_seccion (
  id bigint NOT NULL DEFAULT nextval('tipo_seccion_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  descripcion text,
  campos_metadata jsonb NOT NULL DEFAULT '[]'::jsonb,
  icono character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipo_seccion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contenido_seccion (
  id bigint NOT NULL DEFAULT nextval('contenido_seccion_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  tipo_seccion_id bigint NOT NULL,
  titulo character varying,
  subtitulo character varying,
  descripcion text,
  icono character varying,
  imagen character varying,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  orden integer NOT NULL DEFAULT 0,
  mostrar boolean NOT NULL DEFAULT true,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contenido_seccion_pkey PRIMARY KEY (id),
  CONSTRAINT contenido_seccion_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT contenido_seccion_tipo_seccion_id_fkey FOREIGN KEY (tipo_seccion_id) REFERENCES public.tipo_seccion(id)
);
CREATE TABLE public.registros (
  id bigint NOT NULL DEFAULT nextval('registros_id_seq'::regclass),
  identificador character varying NOT NULL UNIQUE,
  nombre character varying NOT NULL,
  descripcion text,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT registros_pkey PRIMARY KEY (id)
);
CREATE TABLE public.registro_contenido (
  id bigint NOT NULL DEFAULT nextval('registro_contenido_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  registro_id bigint NOT NULL,
  titulo character varying,
  subtitulo character varying,
  descripcion text,
  icono character varying,
  stats character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT registro_contenido_pkey PRIMARY KEY (id),
  CONSTRAINT registro_contenido_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT registro_contenido_registro_id_fkey FOREIGN KEY (registro_id) REFERENCES public.registros(id)
);
CREATE TABLE public.menus (
  id bigint NOT NULL DEFAULT nextval('menus_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  grupo character varying NOT NULL,
  tipo_registro character varying NOT NULL CHECK (tipo_registro::text = ANY (ARRAY['producto'::character varying, 'industria'::character varying, 'servicio'::character varying]::text[])),
  registro_id bigint NOT NULL,
  ruta character varying NOT NULL,
  icono character varying,
  mostrar boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.menu_item (
  id bigint NOT NULL DEFAULT nextval('menu_item_id_seq'::regclass),
  menu_id bigint NOT NULL,
  ruta character varying NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT menu_item_pkey PRIMARY KEY (id),
  CONSTRAINT menu_item_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id)
);
CREATE TABLE public.footers (
  id bigint NOT NULL DEFAULT nextval('footers_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  tipo character varying NOT NULL CHECK (tipo::text = ANY (ARRAY['producto'::character varying, 'industria'::character varying, 'servicio'::character varying, 'red_social'::character varying]::text[])),
  tipo_registro character varying CHECK (tipo_registro::text = ANY (ARRAY['producto'::character varying, 'industria'::character varying, 'servicio'::character varying]::text[])),
  registro_id bigint,
  titulo character varying,
  url character varying,
  icono character varying,
  orden integer NOT NULL DEFAULT 0,
  mostrar boolean NOT NULL DEFAULT true,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT footers_pkey PRIMARY KEY (id),
  CONSTRAINT footers_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.pasos_wizard (
  id bigint NOT NULL DEFAULT nextval('pasos_wizard_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  identificador character varying NOT NULL,
  titulo character varying NOT NULL,
  descripcion character varying NOT NULL,
  fuente_datos character varying NOT NULL,
  campo_filtro character varying,
  orden integer NOT NULL DEFAULT 0,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pasos_wizard_pkey PRIMARY KEY (id),
  CONSTRAINT pasos_wizard_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.contactos (
  id bigint NOT NULL DEFAULT nextval('contactos_id_seq'::regclass),
  empresa_id bigint NOT NULL,
  nombre character varying NOT NULL,
  empresa character varying,
  telefono character varying NOT NULL,
  email character varying NOT NULL,
  mensaje text NOT NULL,
  estado USER-DEFINED NOT NULL DEFAULT 'nuevo'::enum_estado_contacto,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contactos_pkey PRIMARY KEY (id),
  CONSTRAINT contactos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.suscriptores (
  id bigint NOT NULL DEFAULT nextval('suscriptores_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  nombre character varying,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado_suscriptor,
  email_verificado_en timestamp with time zone,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  empresa_id bigint NOT NULL,
  CONSTRAINT suscriptores_pkey PRIMARY KEY (id),
  CONSTRAINT suscriptores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);
CREATE TABLE public.perfiles (
  id uuid NOT NULL,
  nombre_completo character varying NOT NULL,
  telefono character varying,
  avatar_url character varying,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  email character varying,
  CONSTRAINT perfiles_pkey PRIMARY KEY (id),
  CONSTRAINT perfiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.roles (
  id bigint NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  descripcion text,
  es_sistema boolean NOT NULL DEFAULT false,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permisos (
  id bigint NOT NULL DEFAULT nextval('permisos_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  grupo character varying NOT NULL,
  descripcion text,
  estado USER-DEFINED NOT NULL DEFAULT 'activo'::enum_estado,
  eliminado_en timestamp with time zone,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  actualizado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT permisos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rol_permiso (
  rol_id bigint NOT NULL,
  permiso_id bigint NOT NULL,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rol_permiso_pkey PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT rol_permiso_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id),
  CONSTRAINT rol_permiso_permiso_id_fkey FOREIGN KEY (permiso_id) REFERENCES public.permisos(id)
);
CREATE TABLE public.usuario_rol (
  usuario_id uuid NOT NULL,
  rol_id bigint NOT NULL,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT usuario_rol_pkey PRIMARY KEY (usuario_id, rol_id),
  CONSTRAINT usuario_rol_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id),
  CONSTRAINT usuario_rol_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id)
);
CREATE TABLE public.auditoria (
  id bigint NOT NULL DEFAULT nextval('auditoria_id_seq'::regclass),
  usuario_id uuid,
  accion USER-DEFINED NOT NULL,
  tabla_afectada character varying NOT NULL,
  registro_id character varying,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  ip_address character varying,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT auditoria_pkey PRIMARY KEY (id),
  CONSTRAINT auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.perfiles(id)
);