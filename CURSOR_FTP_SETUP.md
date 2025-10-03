# Настройка Cursor для работы с FTP

## Способ 1: Расширение SFTP (рекомендуется)

### 1. Установите расширение
1. Откройте Cursor
2. Перейдите в Extensions (Cmd+Shift+X)
3. Найдите и установите "SFTP" от Natizyskunk

### 2. Настройте подключение
1. Откройте папку проекта в Cursor
2. Нажмите Cmd+Shift+P (Command Palette)
3. Введите "SFTP: Config"
4. Выберите "SFTP: Config"

### 3. Обновите конфигурацию
Замените данные в `.vscode/sftp.json`:

```json
{
    "name": "Squid Farm Server",
    "host": "ваш-ftp-хост.com",
    "protocol": "ftp",
    "port": 21,
    "username": "ваш-пользователь",
    "password": "ваш-пароль",
    "remotePath": "/public_html",
    "uploadOnSave": true,
    "useTempFile": false,
    "openSsh": false,
    "downloadOnOpen": false,
    "ignore": [
        ".vscode",
        ".git",
        ".DS_Store",
        "node_modules",
        "*.log"
    ],
    "watcher": {
        "files": "**/*",
        "autoUpload": true,
        "autoDelete": false
    }
}
```

### 4. Подключитесь к серверу
1. Нажмите Cmd+Shift+P
2. Введите "SFTP: Open SSH in Terminal"
3. Или используйте "SFTP: List All" для просмотра файлов

## Способ 2: Расширение FTP-Sync

### 1. Установите расширение
1. Найдите "FTP-Sync" в Extensions
2. Установите его

### 2. Настройте
1. Cmd+Shift+P → "FTP-Sync: Config"
2. Укажите данные FTP сервера

## Способ 3: Remote Development

### 1. Установите расширение
1. Найдите "Remote - SSH" в Extensions
2. Установите его

### 2. Настройте SSH (если поддерживается)
1. Cmd+Shift+P → "Remote-SSH: Connect to Host"
2. Добавьте SSH конфигурацию

## Команды для работы с FTP

После настройки вы сможете использовать:

- **Cmd+Shift+P → "SFTP: Upload"** - загрузить файл
- **Cmd+Shift+P → "SFTP: Download"** - скачать файл
- **Cmd+Shift+P → "SFTP: Sync Local → Remote"** - синхронизировать
- **Cmd+Shift+P → "SFTP: List All"** - показать файлы на сервере

## Автоматическая загрузка

С настройкой `"uploadOnSave": true` файлы будут автоматически загружаться на сервер при сохранении.

## Безопасность

### Рекомендации:
1. **Не храните пароли в конфиге** - используйте переменные окружения
2. **Используйте SFTP вместо FTP** - более безопасно
3. **Ограничьте доступ** - настройте `.vscode/sftp.json` в `.gitignore`

### Пример с переменными окружения:
```json
{
    "host": "${env:FTP_HOST}",
    "username": "${env:FTP_USER}",
    "password": "${env:FTP_PASS}"
}
```

## Альтернативные способы

### 1. FileZilla + Cursor
- Используйте FileZilla для загрузки файлов
- Редактируйте в Cursor локально
- Загружайте изменения через FileZilla

### 2. Веб-интерфейс ICPmanager
- Редактируйте файлы через веб-интерфейс
- Используйте встроенный редактор

### 3. Git + Auto-deploy
- Настройте автоматический деплой через Git
- Push в репозиторий → автоматическая загрузка на сервер

## Проверка подключения

После настройки:
1. Откройте Command Palette (Cmd+Shift+P)
2. Введите "SFTP: List All"
3. Должны появиться файлы с сервера

## Решение проблем

### Ошибка подключения:
- Проверьте хост, порт, логин, пароль
- Убедитесь, что FTP включен на хостинге
- Проверьте firewall настройки

### Медленная загрузка:
- Отключите `uploadOnSave` для больших файлов
- Используйте `ignore` для исключения ненужных файлов
- Рассмотрите использование SFTP вместо FTP
