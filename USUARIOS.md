# Usuarios de prueba — Ceibal Copiloto Pedagógico

Crear estos 11 usuarios en **AWS Console → Cognito → User Pool `us-east-1_l3LiecZui` → Users → Create user**.

---

## Docente

| Nombre | Email | Grupo |
|--------|-------|-------|
| Gabriela Suárez | gabriela.suarez@ceibal.edu.uy | `docente` |

---

## Alumnos — 3ro A

| Nombre | Email | Grupo |
|--------|-------|-------|
| Sofía Martínez | sofia.martinez@ceibal.edu.uy | `alumno` |
| Lucas Rodríguez | lucas.rodriguez@ceibal.edu.uy | `alumno` |
| Valentina García | valentina.garcia@ceibal.edu.uy | `alumno` |
| Mateo López | mateo.lopez@ceibal.edu.uy | `alumno` |
| Emma Fernández | emma.fernandez@ceibal.edu.uy | `alumno` |

---

## Alumnos — 6to A

| Nombre | Email | Grupo |
|--------|-------|-------|
| Camila Pérez | camila.perez@ceibal.edu.uy | `alumno` |
| Nicolás Díaz | nicolas.diaz@ceibal.edu.uy | `alumno` |
| Florencia Romero | florencia.romero@ceibal.edu.uy | `alumno` |
| Tomás Álvarez | tomas.alvarez@ceibal.edu.uy | `alumno` |
| Isabella Torres | isabella.torres@ceibal.edu.uy | `alumno` |

---

## Pasos en AWS Console

1. **Crear grupos** (si no existen): Groups → Create group → `docente` y `alumno`
2. **Crear cada usuario**: Users → Create user
   - Username: el email completo
   - Email: mismo, marcar "Mark email as verified"
   - Contraseña temporal: `Ceibal2026!`
3. **Asignar grupo**: entrar al usuario → Group memberships → Add to group
4. **Atributo name**: editar usuario → Add attribute `name` con el nombre completo

---

## Seed de la DB

```bash
docker compose up -d
cd apps/api
alembic upgrade head
python seed.py
```
