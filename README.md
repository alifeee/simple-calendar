# Calendar

Extremely simple calendar app

![Screenshot of page](images/calendar.png)

## To use

### Edit calendar

Edit the `yaml` calendar file. For example, to set the status for the 5 days beginning `2024-01-29`...

```yaml
2024-01-29:
- monday info
- ¯\_(ツ)_/¯
- tuesday
-
- friday

2024-02-15: doing this on this specific day
```

### Rebuild site

#### With `npm`

```bash
npm run build
```

#### With docker

(for first-time use switch `run build` for `install`)

```bash
docker run --rm --workdir /_site -v $(pwd):/_site --entrypoint "npm" node:18.16.1-alpine3.18 run build
```

or

```bash
./build.sh
```

## Set up on server

```bash
mkdir -p /var/www/
git clone git@github.com:alifeee/simple-calendar.git /var/www/simple-calendar/
cd /var/www/simple-calendar/
npm install
npm run build
sudo nano /etc/nginx/nginx.conf
```

```nginx
  server {
    server_name cal.alifeee.co.uk;
    location / {
      root /var/www/simple-calendar/_site;
      try_files $uri $uri/ =404;
    }
    location = /edit {
      include fastcgi_params;
      fastcgi_param SCRIPT_FILENAME /var/www/simple-calendar/edit;
      fastcgi_pass unix:/var/run/fcgiwrap.socket;
      auth_basic "calendar edit";
      auth_basic_user_file /etc/nginx/.htpasswd;
    }
    listen 80;
    listen [::]:80;
  }
```

```bash
sudo certbot --nginx
sudo systemctl restart nginx.service
```

Set up Python for CGI edit script

```bash
python3 -m venv env
./env/bin/pip install -r requirements.txt
chown alifeee:www-data _data/alfie.yaml
```

to test edit script:

```bash
echo 'name=alfie&2024-09-01=what' | sudo -u www-data ./edit
```
