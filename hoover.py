#!/var/www/simple-calendar/env/bin/python
"""
hoover up events in yaml that are older than today's date
add to crontab with
  crontab -e
then type
  0 23 * * * /var/www/simple-calendar/hoover.py >> /var/www/simple-calendar/cron.log 2>&1
to run at 11pm every day (wipes current day)
"""

import os
from datetime import datetime, timedelta
from yaml import load, Loader, dump

# remove all events before this many days before now
HOOVER_BEFORE_DAYS = 7

folder = os.path.dirname(os.path.realpath(__file__))

yaml_files = [
    os.path.join(folder, "_data", f)
    for f in os.listdir(os.path.join(folder, "_data"))
    if ".yaml" in f
]

for yaml_file in yaml_files:
    with open(yaml_file, "r", encoding="utf-8") as file:
        contents = file.read()
    contents_yaml = load(contents, Loader=Loader)
    if contents_yaml is None:
        contents_yaml = {}

    # backup
    now = datetime.utcnow()
    now_str = now.strftime("%Y-%m-%dT%H%M%S")
    backup_folder = os.path.join(folder, "backups", now_str)
    if not os.path.exists(backup_folder):
        os.makedirs(backup_folder)
    os.system(f"cp {folder}/_data/* {backup_folder}")

    last_week = now - timedelta(days=HOOVER_BEFORE_DAYS)

    new_events = {}
    hoovered = 0
    for date_str, event in contents_yaml.items():
        if isinstance(event, str):
            date = datetime.strptime(date_str, "%Y-%m-%d")
            if date < last_week:
                hoovered += 1
            else:
                new_events[date_str] = event
        else:
            raise ValueError("cannot deal with lists yet")

    print(f"hoovered {hoovered} events from {yaml_file}")

    if len(new_events) == 0:
        # delete!
        os.remove(yaml_file)
        print("  and deleted it!")
    else:
        # rewrite
        with open(yaml_file, "w", encoding="utf-8") as file:
            file.write(dump(new_events))

os.system(f"(cd {folder}; ./build.sh &>/dev/null)")
