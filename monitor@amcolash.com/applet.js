const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const Settings = imports.ui.settings;

const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

const UUID = 'monitor@amcolash.com';

class CinnamonSettingsExampleApplet extends Applet.TextIconApplet {
  constructor(orientation, panel_height, instance_id) {
    super(orientation, panel_height, instance_id);

    this.settings = new Settings.AppletSettings(this, UUID, instance_id);
    this.settings.bind('icon-name', 'icon_name', this.on_settings_changed);
    this.settings.bind('update-interval', 'update_interval', this.on_settings_changed);
    this.settings.bind('run-command', 'run_command', this.on_settings_changed);

    this.on_settings_changed();
  }

  on_settings_changed() {
    this.update_data();
  }

  update_data() {
    let icon_file = Gio.File.new_for_path(this.icon_name);
    if (icon_file.query_exists(null)) {
      this.set_applet_icon_path(this.icon_name);
    } else {
      this.set_applet_icon_name(this.icon_name);
    }

    if (!this.run_command || this.run_command.length === 0) {
      this.set_applet_label('Please configure the monitor');
      return;
    }

    // cat /home/amcolash/Github/status-scripts/data/spotify
    const data = this._run_cmd(this.run_command).trim();

    const img = data.match(/<img>(.*)<\/img>/);
    let image_file = img && img[1] ? img[1] : '';

    icon_file = Gio.File.new_for_path(image_file);
    if (icon_file.query_exists(null)) this.set_applet_icon_path(image_file);

    const txt = data.match(/<txt>(.*)<\/txt>/);
    const label = txt && txt[1] ? txt[1] : null;
    if (label) this.set_applet_label(label);
    else this.set_applet_label(data);

    const tool = data.match(/<tool>(.*)<\/tool>/);
    const tooltip = tool && tool[1] ? tool[1] : null;
    if (tooltip) this.set_applet_tooltip(tooltip);

    if (this.timeoutId) Mainloop.source_remove(this.timeoutId);
    this.timeoutId = Mainloop.timeout_add(this.update_interval, Lang.bind(this, this.update_data));
  }

  _run_cmd(command) {
    // run a command and return the output
    try {
      let [result, stdout, stderr] = GLib.spawn_command_line_sync(command);
      if (stdout != null) {
        return stdout.toString();
      }
    } catch (e) {
      global.logError(e);
    }

    return '';
  }

  // on_applet_removed_from_panel() {
  //   // stop the loop when the applet is removed
  //   if (this._updateLoopID) {
  //     Mainloop.source_remove(this._updateLoopID);
  //   }
  // }

  // _run_cmd(command) {
  //   // run a command and return the output
  //   try {
  //     let [result, stdout, stderr] = GLib.spawn_command_line_sync(command);
  //     if (stdout != null) {
  //       return stdout.toString();
  //     }
  //   } catch (e) {
  //     global.logError(e);
  //   }

  //   return "";
  // }

  // _get_status() {
  //   // let status = this._run_cmd("whoami");
  //   // // update the label with the output of your command
  //   // this.set_applet_label(status);
  // }

  // _update_loop() {
  //   this._get_status();
  //   // run the loop every 5000 ms
  //   this._updateLoopID = Mainloop.timeout_add(
  //     this.update_interval,
  //     Lang.bind(this, this._update_loop)
  //   );
  // }
}

function main(metadata, orientation, panel_height, instance_id) {
  // Make sure you collect and pass on instanceId
  return new CinnamonSettingsExampleApplet(orientation, panel_height, instance_id);
}
