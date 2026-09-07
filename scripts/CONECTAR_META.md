# Conectar Meta a Contenido Hub — guía de David

Con esto la plataforma programa por ti: **Facebook queda agendado en Meta** y
**Instagram se publica a la hora exacta desde tu Mac**. Los tokens viven solo
en tu Mac (`~/Library/Application Support/ContenidoHub/meta.json`) — nunca en
el repo, que es público.

## Lo que haces UNA sola vez (~10 minutos)

### 1. Crear tu app de Meta
1. Entra a https://developers.facebook.com → **Mis apps** → **Crear app**.
2. Caso de uso: **Otro** → tipo **Negocios** (Business). Nombre: `Contenido Hub`.
3. La app puede quedarse **en modo desarrollo para siempre**: como tú eres el
   admin de la app Y de las páginas, no necesita revisión de Meta.

### 2. Copiar App ID y App Secret
- En la app: **Configuración → Básica** → copia **Identificador de la app**
  (App ID) y **Clave secreta** (App Secret, botón *Mostrar*).

### 3. Generar el token
1. Abre https://developers.facebook.com/tools/explorer
2. Arriba a la derecha elige tu app `Contenido Hub`.
3. En **Permisos** agrega:
   `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`,
   `instagram_basic`, `instagram_content_publish`, `business_management`
4. Botón **Generate Access Token** → acepta el diálogo de Facebook marcando
   **las dos páginas** (Café Forestal y la de Grupo Manzanares / Carnes
   Manzanares) y sus Instagram.
5. Copia el token que aparece (es largo; vence en 1 hora, pero el script lo
   cambia por tokens de página que **no vencen**).

### 4. Correr el conector (pega los 3 datos en TU terminal)
```bash
python3 "/Users/davidduffel/Library/Application Support/ContenidoHub/repo/scripts/conectar_meta.py"
```
El script encuentra las dos páginas, detecta sus Instagram vinculados y
guarda la configuración con permisos privados.

### 5. Verificar
```bash
python3 "/Users/davidduffel/Library/Application Support/ContenidoHub/repo/scripts/publicar_meta.py" --verificar
```
Debe decir `✅ Todo listo para publicar.`

### 6. Encender el trabajador (cada 5 minutos)
```bash
cp "/Users/davidduffel/Library/Application Support/ContenidoHub/repo/scripts/com.contenidohub.meta.plist" ~/Library/LaunchAgents/ && launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.contenidohub.meta.plist
```

## Cómo se usa después (todos los días)
1. En la plataforma: abre la pieza → **📤 Programar publicación** → activa
   **🤖 Programar automáticamente** y elige Instagram / Facebook / Ambas.
2. Toca **Guardar cambios** (el botón flotante) — así la cola llega al Mac.
3. Listo:
   - **Facebook** queda agendado en Meta a los pocos minutos (lo ves en el
     calendario de Meta Business Suite). Se publica solo aunque apagues el Mac.
   - **Instagram** sale a la hora elegida si el Mac está encendido; si estaba
     dormido, sale al despertar (te llega la notificación ntfy de todo).

## Detalles buenos de saber
- Instagram **exige portada** (JPEG). Sin portada, solo sale en Facebook.
- La portada se sube como `portadas/<id>.jpg` al repo público (igual ya viaja
  en `estado.json`, no se expone nada nuevo).
- Límite de Meta: máx. 100 publicaciones por API cada 24 h por cuenta de IG.
- Si cambias fecha/hora/red de una pieza ya agendada, el trabajador retira la
  programación vieja de Facebook y la vuelve a agendar.
- Registro de actividad: `~/Library/Logs/contenidohub-meta.log`
- Si algo falla te avisa por ntfy (máx. 5 reintentos por pieza).
