# -*- coding: utf-8 -*-
from sqlalchemy.orm import Session
from sqlalchemy import text
import traceback
from typing import Any
from app.core.database import engine_pg
from passlib.context import CryptContext

# Importaciones de modelos
from app.models.Departamento import Departamento
from app.models.Municipio import Municipio
from app.models.TipoIncidente import TipoIncidente
from app.models.SubtipoIncidente import SubtipoIncidente
from app.models.Rol import Rol
from app.models.Regional import Regional
from app.models.Permisos import Permiso
from app.models.usuario import Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_all():
    try:
        with Session(engine_pg) as session:
            print("--- Iniciando Poblacion Masiva de Catalogos (Modo Compatible) ---")

            # 1. REGIONALES
            print("📦 Cargando Regionales...")
            regionales_data = [
                (1, "Tegucigalpa"), 
                (2, "San Pedro Sula"), 
                (3, "Tela"), 
                (4, "Santa Rosa de Copan"), 
                (5, "Choluteca")
            ]
            for r_id, nom in regionales_data:
                # Primero verificamos si el NOMBRE ya existe para evitar UniqueViolation
                existing_by_name = session.query(Regional).filter(Regional.nombre == nom).first()
                if existing_by_name:
                    continue # Si el nombre ya existe, saltamos para no causar error de unicidad

                obj = session.get(Regional, r_id)
                if not obj:
                    session.add(Regional(id=r_id, nombre=nom))
                else:
                    setattr(obj, "nombre", nom)
            session.flush()

            # 2. ROLES
            print("📦 Cargando Roles...")
            roles_data = [
                (1, "Administrador"),
                (2, "Analista"),
                (3, "Operador"),
                (4, "Supervisor")
            ]
            for rol_id, nom in roles_data:
                # Verificamos si el NOMBRE ya existe
                existing_by_name = session.query(Rol).filter(Rol.nombre == nom).first()
                if existing_by_name:
                    continue

                obj = session.get(Rol, rol_id)
                if not obj:
                    session.add(Rol(id=rol_id, nombre=nom))
                else:
                    setattr(obj, "nombre", nom)
            session.flush()

            # 3. DEPARTAMENTOS
            print("📦 Cargando Departamentos...")
            deptos_data = [
                (1, "Francisco Morazan"), (2, "El Paraiso"), (3, "Choluteca"), (4, "Valle"),
                (5, "Comayagua"), (6, "Cortes"), (7, "Atlantida"), (8, "Colon"),
                (9, "Copan"), (10, "Gracias a Dios"), (11, "Intibuca"), (12, "Islas de la Bahia"),
                (13, "La Paz"), (14, "Lempira"), (15, "Ocotepeque"), (16, "Olancho"),
                (17, "Santa Barbara"), (18, "Yoro"), (19, "Indeterminado")
            ]
            for d_id, nom in deptos_data:
                existing_by_name = session.query(Departamento).filter(Departamento.nombre == nom).first()
                if existing_by_name:
                    continue

                obj = session.get(Departamento, d_id)
                if not obj:
                    session.add(Departamento(id=d_id, nombre=nom))
                else:
                    setattr(obj, "nombre", nom)
            session.flush()

            # 4. MUNICIPIOS
            print("📦 Cargando Municipios...")
            municipios_data = [
                (110, 1, "Distrito Central"), (111, 1, "Alubaren"), (112, 1, "Cedros"), (113, 1, "Curaren"), (114, 1, "Maraita"), (115, 1, "Marale"), (116, 1, "Nueva Armenia"), (117, 1, "Ojojona"), (118, 1, "Orica"), (119, 1, "Reitoca"), (120, 1, "Sabanagrande"), (121, 1, "San Antonio de Oriente"), (122, 1, "San Buena Aventura"), (123, 1, "San Ignacio"), (124, 1, "San Juan de Flores"), (125, 1, "San Miguelito"), (126, 1, "Santa Ana"), (127, 1, "Santa Lucia"), (128, 1, "Talanga"), (129, 1, "Tatumbla"), (130, 1, "Valle de Angeles"), (131, 1, "Villa de San Francisco"), (132, 1, "Vallecillo"), (133, 1, "El Porvenir"), (134, 1, "Guaimaca"), (135, 1, "La Libertad"), (136, 1, "La Venta"), (137, 1, "Lepaterique"), (301, 1, "Indeterminado"),
                (91, 2, "Yuscaran"), (92, 2, "Alauca"), (93, 2, "Danli"), (94, 2, "El Paraiso"), (95, 2, "Guinope"), (96, 2, "Jacaleapa"), (97, 2, "Liure"), (98, 2, "Moroceli"), (99, 2, "Oropoli"), (100, 2, "Potrerillos"), (101, 2, "San Antonio de Flores"), (102, 2, "San Lucas"), (103, 2, "San Matias"), (104, 2, "Soledad"), (105, 2, "Teupasenti"), (106, 2, "Texiguat"), (107, 2, "Vado Ancho"), (108, 2, "Yauyupe"), (109, 2, "Trojes"), (302, 2, "Indeterminado"),
                (75, 3, "Choluteca"), (76, 3, "Apacilagua"), (77, 3, "Concepcion de Maria"), (78, 3, "Duyure"), (79, 3, "El Corpus"), (80, 3, "El Triunfo"), (81, 3, "Marcovia"), (82, 3, "Morolica"), (83, 3, "Namasigue"), (84, 3, "Orocuina"), (85, 3, "Pespire"), (86, 3, "San Antonio de Flores"), (87, 3, "San Isidro"), (88, 3, "San Jose"), (89, 3, "San Marcos de Colon"), (90, 3, "Santa Ana de Yusguare"), (303, 3, "Indeterminado"),
                (279, 4, "Nacaome"), (280, 4, "Alianza"), (281, 4, "Amapala"), (282, 4, "Aramecina"), (283, 4, "Caridad"), (284, 4, "Goascoran"), (285, 4, "Langue"), (286, 4, "San Fco. de Coray"), (287, 4, "San Lorenzo"), (304, 4, "Indeterminado"),
                (19, 5, "Comayagua"), (20, 5, "Ajuterique"), (21, 5, "El Rosario"), (22, 5, "Esquias"), (23, 5, "Humuya"), (24, 5, "La Libertad"), (25, 5, "Lamani"), (26, 5, "La Trinidad"), (27, 5, "Lejamani"), (28, 5, "Meambar"), (29, 5, "Minas de Oro"), (30, 5, "Ojos de Agua"), (31, 5, "San Jeronimo"), (32, 5, "San Jose de Comayagua"), (33, 5, "San Jose del Potrero"), (34, 5, "San Luis"), (35, 5, "San Sebastian"), (36, 5, "Siguatepeque"), (37, 5, "Villa de San Antonio"), (38, 5, "Lajas"), (39, 5, "Taulabe"), (305, 5, "Indeterminado"),
                (63, 6, "San Pedro Sula"), (64, 6, "Choloma"), (65, 6, "Omoa"), (66, 6, "Pimienta"), (67, 6, "Potrerillos"), (68, 6, "Puerto Cortes"), (69, 6, "San Antonio de Cortes"), (70, 6, "San Francisco de Yojoa"), (71, 6, "San Manuel"), (72, 6, "Santa Cruz de Yojoa"), (73, 6, "Villanueva"), (74, 6, "La Lima"), (306, 6, "Indeterminado"),
                (1, 7, "La Ceiba"), (2, 7, "El Porvenir"), (3, 7, "Esparta"), (4, 7, "Jutiapa"), (5, 7, "La Masica"), (6, 7, "San Francisco"), (7, 7, "Tela"), (8, 7, "Arizona"), (307, 7, "Indeterminado"),
                (9, 8, "Trujillo"), (10, 8, "Balfate"), (11, 8, "Iriona"), (12, 8, "Limon"), (13, 8, "Saba"), (14, 8, "Santa Fe"), (15, 8, "Santa Rosa de Aguan"), (16, 8, "Sonaguera"), (17, 8, "Tocoa"), (18, 8, "Bonito Oriental"), (308, 8, "Indeterminado"),
                (40, 9, "Santa Rosa de Copan"), (41, 9, "Cabañas"), (42, 9, "Concepcion"), (43, 9, "Copan Ruinas"), (44, 9, "Corquin"), (45, 9, "Cucuyagua"), (46, 9, "Dolores"), (47, 9, "Dulce Nombre"), (48, 9, "El Paraiso"), (49, 9, "Florida"), (50, 9, "La Jigua"), (51, 9, "La Union"), (52, 9, "Nueva Arcadia"), (53, 9, "San Agustin"), (54, 9, "San Antonio"), (55, 9, "San Jeronimo"), (56, 9, "San Jose"), (57, 9, "San Juan de Opoa"), (58, 9, "San Nicolas"), (59, 9, "San Pedro"), (60, 9, "Santa Rita"), (61, 9, "Trinidad"), (62, 9, "Veracruz"), (309, 9, "Indeterminado"),
                (138, 10, "Puerto Lempira"), (139, 10, "Brus Laguna"), (140, 10, "Ahuas"), (141, 10, "Juan Francisco Bulnes"), (142, 10, "Villeda Morales"), (143, 10, "Wampusirpe"), (310, 10, "Indeterminado"),
                (144, 11, "La Esperanza"), (145, 11, "Camasca"), (146, 11, "Colomoncagua"), (147, 11, "Concepcion"), (148, 11, "Dolores"), (149, 11, "Intibuca"), (150, 11, "Jesus de Otoro"), (151, 11, "Magdalena"), (152, 11, "Masaguara"), (153, 11, "San Antonio"), (154, 11, "San Isidro"), (155, 11, "San Juan"), (156, 11, "San Marcos de la Sierra"), (157, 11, "San Miguel Guancapla"), (158, 11, "Santa Lucia"), (159, 11, "Yamaranguila"), (160, 11, "San Francisco Opalaca"), (311, 11, "Indeterminado"),
                (161, 12, "Roatan"), (162, 12, "Guanaja"), (163, 12, "Jose Santos Guardiola"), (164, 12, "Utila"), (312, 12, "Indeterminado"),
                (165, 13, "La Paz"), (166, 13, "Aguanqueterique"), (167, 13, "Cabañas"), (168, 13, "Cane"), (169, 13, "Chinacla"), (170, 13, "Guajiquiro"), (171, 13, "Luterique"), (172, 13, "Marcala"), (173, 13, "Mercedes de Oriente"), (174, 13, "Opatoro"), (175, 13, "San Antonio del Norte"), (176, 13, "San Jose"), (177, 13, "San Juan"), (178, 13, "San Pedro de Tutule"), (179, 13, "Santa Ana"), (180, 13, "Santa Elena"), (181, 13, "Santa Maria"), (182, 13, "Santiago Puringla"), (183, 13, "Yarula"), (313, 13, "Indeterminado"),
                (184, 14, "Gracias"), (185, 14, "Belen"), (186, 14, "Candelaria"), (187, 14, "Cololaca"), (188, 14, "Erandique"), (189, 14, "Gualcinse"), (190, 14, "Guarita"), (191, 14, "La Campa"), (192, 14, "La Iguala"), (193, 14, "Piraera"), (194, 14, "San Andres"), (195, 14, "San Francisco"), (196, 14, "San Juan Guarita"), (197, 14, "San Manuel Colohete"), (198, 14, "San Rafael"), (199, 14, "San Sebastian"), (200, 14, "Santa Cruz"), (201, 14, "Talgua"), (202, 14, "Tambla"), (203, 14, "Tomala"), (204, 14, "Valladolid"), (205, 14, "Virginia"), (206, 14, "San Marcos de Caiquin"), (207, 14, "Las Flores"), (208, 14, "La Union"), (209, 14, "La Virtud"), (210, 14, "Lepaera"), (211, 14, "Mapulaca"), (314, 14, "Indeterminado"),
                (235, 15, "Nueva Ocotepeque"), (236, 15, "Belen Gualcho"), (237, 15, "Concepcion"), (238, 15, "Dolores Merendon"), (239, 15, "Fraternidad"), (240, 15, "La Encarnacion"), (241, 15, "La Labor"), (242, 15, "Lucerna"), (243, 15, "Mercedes"), (244, 15, "San Fernando"), (245, 15, "San Francisco del Valle"), (246, 15, "San Jorge"), (247, 15, "San Marcos"), (248, 15, "Santa Fe"), (249, 15, "Sensenti"), (250, 15, "Sinuapa"), (315, 15, "Indeterminado"),
                (212, 16, "Juticalpa"), (213, 16, "Campamento"), (214, 16, "Catacamas"), (215, 16, "Concordia"), (216, 16, "Dulce Nombre de Culmi"), (217, 16, "El Rosario"), (218, 16, "Esquipulas del Norte"), (219, 16, "Gualaco"), (220, 16, "Guarizama"), (221, 16, "Guata"), (222, 16, "Guayape"), (223, 16, "Jano"), (224, 16, "La Union"), (225, 16, "Mangulile"), (226, 16, "Manto"), (227, 16, "Salama"), (228, 16, "San Esteban"), (229, 16, "San Francisco de Becerra"), (230, 16, "San Francisco de la Paz"), (231, 16, "Santa Maria del Real"), (232, 16, "Silca"), (233, 16, "Yocon"), (299, 16, "Patuca"), (316, 16, "Indeterminado"),
                (251, 17, "Santa Barbara"), (252, 17, "Arada"), (253, 17, "Atima"), (254, 17, "Azacualpa"), (255, 17, "Ceguaca"), (256, 17, "Colinas"), (257, 17, "Concepcion del Norte"), (258, 17, "Concepcion del Sur"), (259, 17, "Chinda"), (260, 17, "El Nispero"), (261, 17, "Gualala"), (262, 17, "Ilama"), (263, 17, "Macuelizo"), (264, 17, "Naranjito"), (265, 17, "Nuevo Celilac"), (266, 17, "Petoa"), (267, 17, "Proteccion"), (268, 17, "Quimistan"), (269, 17, "San Francisco de Ojuera"), (270, 17, "San Luis"), (271, 17, "San Marcos"), (272, 17, "San Nicolas"), (273, 17, "San Pedro Zacapa"), (274, 17, "Santa Rita"), (275, 17, "San Vicente Centenario"), (276, 17, "Trinidad"), (277, 17, "Las Vegas"), (278, 17, "Nueva Frontera"), (317, 17, "Indeterminado"),
                (288, 18, "Yoro"), (289, 18, "Arenal"), (290, 18, "El Negrito"), (291, 18, "El Progreso"), (292, 18, "Jocon"), (293, 18, "Morazan"), (294, 18, "Olanchito"), (295, 18, "Santa Rita"), (296, 18, "Sulaco"), (297, 18, "Victoria"), (298, 18, "Yorito"), (318, 18, "Indeterminado"),
                (300, 19, "Indeterminado")
            ]
            for m_id, d_id, nom in municipios_data:
                # Verificamos si ya existe ese nombre en el mismo departamento para evitar duplicados
                existing = session.query(Municipio).filter(Municipio.nombre == nom, Municipio.departamento_id == d_id).first()
                if existing:
                    continue

                obj = session.get(Municipio, m_id)
                if not obj:
                    session.add(Municipio(id=m_id, departamento_id=d_id, nombre=nom))
                else:
                    setattr(obj, "nombre", nom)
                    setattr(obj, "departamento_id", d_id)
            session.flush()

            # 5. TIPOS DE INCIDENTE
            print("📦 Cargando Tipos de Incidente...")
            tipos_incidente_data = [
                (1, "Accidente de Transito(simple)"), (2, "Asistencia"), (3, "Casos De Alcaldia"),
                (4, "Delitos Comunes"), (5, "Delitos Contra La Mujer u Hombre"),
                (6, "Delitos Contra la Ninez y Adolescencia"), (7, "Delitos Contra La Propiedad"),
                (8, "Delitos Contra la Vida"), (9, "Desastres Naturales"), (10, "Emergencia Medica"),
                (11, "Incendio"), (12, "Investigacion"), (13, "Otras Causas De Muerte"),
                (14, "Reportes Recibidos"), (15, "Delitos Y Faltas Electorales"),
                (16, "Delitos Electorales"), (17, "Migrante Retornado")
            ]
            for t_id, nom in tipos_incidente_data:
                existing_by_name = session.query(TipoIncidente).filter(TipoIncidente.nombre == nom).first()
                if existing_by_name:
                    continue

                obj = session.get(TipoIncidente, t_id)
                if not obj:
                    session.add(TipoIncidente(id=t_id, nombre=nom))
                else:
                    setattr(obj, "nombre", nom)
            session.flush()

            # 6. SUBTIPOS DE INCIDENTE
            print("📦 Cargando Subtipos de Incidente...")
            subtipos_data = [
                (1, "Atropello", 1), (2, "Choque", 1), (3, "Colision", 1), (4, "Caida", 1), (5, "Despiste", 1), (6, "Volcamiento", 1), (7, "Asistencia", 2), (8, "Asistencia Psicologica", 2), (9, "Ayuda Humanitaria", 2), (10, "Covid-19", 2), (11, "Eventos Publicos", 2), (12, "Resguardo Policial / Presencia Policial", 2), (13, "Alteracion De Linderos", 3), (14, "Conflicto Vecinal", 3), (15, "Congestionamiento", 3), (16, "Desalojo O Readecuacion/Cierre De Establecimiento", 3), (17, "Invasion De Via Publica", 3), (18, "Ley Seca", 3), (19, "Mendicidad", 3), (20, "Negocios Clandestinos", 3), (21, "Problemas De Agua Potable", 3), (22, "Quema De Basura", 3), (23, "Semaforo En Mal Estado", 3), (24, "Semovientes", 3), (25, "Tala De Arboles", 3), (26, "Vehiculo Abandonado", 3), (27, "Vehiculo En Mal Estado", 3), (28, "Vehiculos Mal Estacionados", 3), (29, "Venta De Polvora", 3), (30, "Allanamiento De Domicilio", 4), (31, "Amenazas", 4), (32, "Chantaje", 4), (33, "Conduccion Temeraria", 4), (34, "Contrabando", 4), (35, "Delitos Ambientales", 4), (36, "Delitos De Desobediencia", 4), (37, "Delitos Contra Derechos Laborales", 4), (38, "Desordenes Publicos", 4), (39, "Estragos", 4), (40, "Exhibicionismo", 4), (41, "Injurias Y Calumnias", 4), (42, "Maltrato O Abandono Animal", 4), (43, "Perturbacion Del Orden", 4), (44, "Quebrantamiento De Condena O Medida", 4), (45, "Abandono Ancianos/Personas Con Discapacidad/Personas Enfermas", 5), (46, "Bigamia", 5), (47, "Delitos Contra La Libertad Religiosa / Practica De Rituales", 5), (48, "Discriminacion", 5), (49, "Hostigamiento Sexual", 5), (50, "Maltrato Familiar", 5), (51, "Otras Agresiones Sexuales", 5), (52, "Tentativa De Violacion", 5), (53, "Trata De Personas", 5), (54, "Trato Degradante", 5), (55, "Violacion Sexual", 5), (56, "Violencia Domestica", 5), (57, "Abandono De Menores", 6), (58, "Estupro", 6), (59, "Explotacion Laboral Infantil", 6), (60, "Hostigamiento Sexual", 6), (61, "Incesto", 6), (62, "Incumplimiento Del Deber De Asistencia Y El Sustento", 6), (63, "Induccion Al Abandono Del Hogar", 6), (64, "Maltrato Familiar", 6), (65, "Otras Agresiones Sexuales", 6), (66, "Pornografia Infantil", 6), (67, "Sustraccion De Menores", 6), (68, "Tentativa De Violacion (Menores)", 6), (69, "Trata De Personas (Menores)", 6), (70, "Trato Degradante (Menores)", 6), (71, "Violacion Sexual Especial", 6), (72, "Agiotaje", 7), (73, "Danos", 7), (74, "Estafa", 7), (75, "Extorsion", 7), (76, "Fraude", 7), (77, "Hurto A Comercio", 7), (78, "Hurto De Cosecha", 7), (79, "Hurto A Personas", 7), (80, "Hurto A Vehiculo Automotor", 7), (81, "Hurto De Arma De Fuego", 7), (82, "Hurto De Vehiculo", 7), (83, "Hurto A Vivienda", 7), (84, "Hurto De Ganado", 7), (85, "Hurto", 7), (86, "Loterias Y Juegos No Autorizados", 7), (87, "Robo De Arma De Fuego", 7), (88, "Robo A Comercio", 7), (89, "Robo A Personas", 7), (90, "Robo A Vehiculo Automotor", 7), (91, "Robo A Vivienda", 7), (92, "Robo De Ganado", 7), (93, "Robo De Vehiculo Automotor", 7), (94, "Robo", 7), (95, "Tentativa De Hurto", 7), (96, "Tentativa De Robo", 7), (97, "Usura", 7), (98, "Usurpacion", 7), (99, "Aborto", 8), (100, "Amenazas A Muerte", 8), (101, "Atentado", 8), (102, "Femicidio", 8), (103, "Induccion Y Auxilio Al Suicidio", 8), (104, "Hallazgo De Feto/Bebe Humano", 8), (105, "Homicidio", 8), (106, "Tentativa De Homicidio", 8), (107, "Lesiones", 8), (108, "Parricidio", 8), (109, "Secuestro", 8), (110, "Privacion Ilegal De La Libertad", 8), (111, "Asociacion Terrorista", 8), (112, "Tortura", 8), (113, "Derrumbes", 9), (114, "Desbordamientos", 9), (115, "Deslave", 9), (116, "Fenomeno De Sequia", 9), (117, "Inundaciones", 9), (118, "Marejadas", 9), (119, "Maremoto", 9), (120, "Terremoto", 9), (121, "Tromba Marina ", 9), (122, "Tsunami", 9), (123, "Vientos Racheados", 9), (124, "Emergencia Medica", 10), (125, "Covid-19", 10), (126, "Asesoria y Consulta Medica", 10), (127, "Lineas Y Tendido Electrico", 11), (128, "Embarcaciones", 11), (129, "Estructural", 11), (130, "Forestal", 11), (131, "Vehicular", 11), (132, "Zacatera", 11), (133, "Abuso De Autoridad/Violacion De Deberes", 12), (134, "Activacion De Alarmas", 12), (135, "Amotinamiento", 12), (136, "Asociacion Ilicita", 12), (137, "Busqueda", 12), (138, "Cohecho", 12), (139, "Consumo De Droga", 12), (140, "Desplazamiento Forzado", 12), (141, "Disparos Por Arma De Fuego", 12), (142, "Enfrentamiento Entre Grupos Delictivos", 12), (143, "Falsificacion De Documentos", 12), (144, "Uso Indebido De Indumentaria Policial O Militar", 12), (145, "Decomisos", 12), (146, "Infracciones", 12), (147, "Personas Desaparecidas", 12), (148, "Persona Tendida En La Calle", 12), (149, "Personas Detenidas Por Causas Desconocidas", 12), (150, "Personas Sospechosas", 12), (151, "Reten/Operativo", 12), (152, "Requerimiento De Vehiculo O Persona", 12), (153, "Saturaciones", 12), (154, "Seguimiento", 12), (155, "Tenencia Y Porte Ilegal De Armas", 12), (156, "Trafico De Armas", 12), (157, "Trafico De Drogas", 12), (158, "Trafico Ilicito De Personas", 12), (159, "Traslado De Personas Detenidas", 12), (160, "Vehiculos Sospechosos", 12), (161, "Venta De Droga", 12), (162, "Venta Y Consumo De Droga", 12), (163, "Muerte En Incendio", 13), (164, "Muerte Por Causas Naturales", 13), (165, "Muerte Por Sumersion", 13), (166, "Muerte Por Intoxicacion", 13), (167, "Suicidio", 13), (168, "Muerte Por Atragantamiento", 13), (169, "Muerte Por Causas Desconocidas", 13), (170, "Muerte Por Aplastamiento Por Objeto Pesado", 13), (171, "Muerte Por Caida", 13), (172, "Muerte Por Electrocucion", 13), (173, "Animales Muertos", 14), (174, "Animales Peligrosos", 14), (175, "Extravio De Chapa De Una Autoridad", 14), (176, "Extravio De Documentos Y Objetos Personales", 14), (177, "Extravio De Arma De Fuego", 14), (178, "Extravio De Placas Vehiculares", 14), (179, "Fuga De Sustancias Peligrosas E Inflamables", 14), (180, "Fumigacion", 14), (181, "Manifestaciones Pacificas", 14), (182, "Persona Extraviada", 14), (183, "Problemas En El Tendido Electrico", 14), (184, "Naufragio", 14), (185, "Quema De Polvora", 14), (186, "Reporte Oficial De Dia / Paramedico De Turno", 14), (187, "Refuerzo Policial", 14), (188, "Rescate Animal", 14), (189, "Respuesta A Denuncia", 14), (190, "Rescate A Personas", 14), (191, "Abuso de Autoridad", 15), (192, "Aglomeracion De Personas", 15), (193, "Cambio Injustificado Del Lugar De Votacion", 15), (194, "Coaccion Y Amenazas Electorales", 15), (195, "Comprar O Vender Votos", 15), (196, "Danos", 15), (197, "Destruccion de Propaganda", 15), (198, "Emergencia Medica", 15), (199, "Estructura Criminal Cerca De Los Centros De Votacion", 15), (200, "Extraccion De Votos Antes De La Verificacion Del Escrutinio", 15), (201, "Falsificacion De Documentos Electorales", 15), (202, "Impedir Revision De Urnas", 15), (203, "Incendios", 15), (204, "Irregularidad En Las Mesas Electorales", 15), (205, "Perturbacion Del Orden", 15), (206, "Retencion Material Electoral", 15), (207, "Ventas De Bebidas Alcoholicas", 15), (208, "Intento de suicidio", 8), (209, "Reportes DNI", 15), (210, "Seguimiento Medico", 10), (211, "Retencion ilicita de cedula", 16), (212, "Compra y venta de votos", 16), (213, "Alteracion del orden en el proceso electoral", 16), (214, "Abuso de autoridad electoral", 16), (215, "Intimidacion, engano y acoso electoral", 16), (216, "Hurto o sabotaje al proceso electoral y de escrutinio", 16), (217, "Fraude electoral", 16), (218, "Destruccion de Propaganda", 16), (219, "Violacion del Secreto de Voto", 16), (220, "Campana Electoral Ilegal", 16), (221, "Atencion Medica", 17), (222, "Atencion Psicologica", 17), (223, "Asesoria Legal", 17), (224, "Ayuda Humanitaria", 17), (225, "Ley Seca", 16), (226, "Emergencia Medica", 16), (227, "Estructura Criminal Cerca de Centro Votacion", 16), (228, "Falsificacion Documentos Electorales", 16), (229, "Incendios", 16), (230, "Retencion Material Electoral", 16), (231, "Venta Bebidas Alcoholicas", 16), (232, "SAE COPECO", 2), (233, "SAE SINAGER", 2), (234, "SAE Bomberos", 2), (235, "SAE Policia Nacional", 2), (236, "SAE Policia Militar", 2), (237, "SAE ICF", 2), (238, "SAE SESAL", 2)
            ]
            for s_id, nom, t_id in subtipos_data:
                # Verificamos si ya existe ese nombre para ese tipo de incidente
                existing = session.query(SubtipoIncidente).filter(SubtipoIncidente.nombre == nom, SubtipoIncidente.tipo_incidente_id == t_id).first()
                if existing:
                    continue

                obj = session.get(SubtipoIncidente, s_id)
                if not obj:
                    session.add(SubtipoIncidente(id=s_id, nombre=nom, tipo_incidente_id=t_id))
                else:
                    setattr(obj, "nombre", nom)
                    setattr(obj, "tipo_incidente_id", t_id)
            session.flush()

            # Ajuste de Secuencias
            print("⚙️ Ajustando secuencias de Postgres...")
            tablas_secuencias = {
                'departamentos': 'id', 
                'municipios': 'id', 
                'tipos_incidente': 'id', 
                'subtipos_incidente': 'id',
                'regionales': 'id',
                'roles': 'id'
            }
            for tabla, col in tablas_secuencias.items():
                try:
                    sql = f"SELECT setval(pg_get_serial_sequence('{tabla}', '{col}'), (SELECT MAX({col}) FROM {tabla}));"
                    session.execute(text(sql))
                except Exception as e:
                    print(f"Advertencia ajustando secuencia de {tabla}: {e}")
                    
        # 7. USUARIO ADMINISTRADOR INICIAL
            # 7. USUARIO ADMINISTRADOR INICIAL
            print("👤 Creando Usuario Administrador por defecto...")
            
            # Datos del admin (Ajustados a tu modelo)
            admin_username = "admin"
            admin_email = "admin@sistema.com"
            admin_pass = "admin123" # Recuerda cambiarla después
            
            # Verificar si ya existe por email o nombre_usuario
            existing_admin = session.query(Usuario).filter(
                (Usuario.email == admin_email) | (Usuario.nombre_usuario == admin_username)
            ).first()
            
            if not existing_admin:
                nuevo_admin = Usuario(
                    nombre_usuario=admin_username,
                    email=admin_email,
                    password_hash=pwd_context.hash(admin_pass), # Usando tu columna password_hash
                    es_admin=True,   # Tu modelo tiene este booleano
                    rol_id=1,        # Vinculado al Rol "Administrador" (ID 1)
                    regional_id=1    # Vinculado a "Tegucigalpa" (ID 1)
                )
                session.add(nuevo_admin)
                print(f"✅ Usuario '{admin_username}' creado con éxito.")
            else:
                print(f"ℹ️ El usuario administrador ya existe.")

            session.flush()

            # 8. Ajuste de secuencia para la tabla usuarios
            try:
                sql_user = "SELECT setval(pg_get_serial_sequence('usuarios', 'id'), (SELECT MAX(id) FROM usuarios));"
                session.execute(text(sql_user))
            except Exception:
                pass

            session.commit()
            print("--- 🚀 PROCESO COMPLETADO EXITOSAMENTE ---")

    except Exception as e:
        print(f"ERROR CRITICO: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    seed_all()