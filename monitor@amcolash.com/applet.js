const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Util = imports.misc.util;
const Settings = imports.ui.settings;

const UUID = 'monitor@amcolash.com';

class CinnamonSettingsExampleApplet extends Applet.TextIconApplet {
  constructor(orientation, panel_height, instance_id) {
    super(orientation, panel_height, instance_id);

    this.settings = new Settings.AppletSettings(this, UUID, instance_id);
    this.settings.bind('update-interval', 'update_interval', this.on_settings_changed);
    this.settings.bind('run-command', 'run_command', this.on_settings_changed);

    this.on_settings_changed();
  }

  on_settings_changed() {
    this.update_data();
  }

  update_data() {
    if (!this.run_command || this.run_command.length === 0) {
      this.set_applet_label('Please configure the monitor');
      return;
    }

    const data = this._run_cmd(this.run_command).trim();

    const img = data.match(/<img>([.\s\S]*)<\/img>/);
    let image_file = img && img[1] ? img[1] : '';

    const icon_file = Gio.File.new_for_path(image_file);
    if (icon_file.query_exists(null) && image_file.length > 0) this.set_applet_icon_path(image_file);
    else this.hide_applet_icon();

    const txt = data.match(/<txt>([.\s\S]*)<\/txt>/);
    const label = txt && txt[1] ? txt[1] : null;
    if (label) this.set_applet_label(label.trim());
    else this.set_applet_label(data);

    const tool = data.match(/<tool>([.\s\S]*)<\/tool>/);
    const tooltip = tool && tool[1] ? tool[1] : null;
    if (tooltip) this.set_applet_tooltip(tooltip.trim());

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
}

function main(metadata, orientation, panel_height, instance_id) {
  return new CinnamonSettingsExampleApplet(orientation, panel_height, instance_id);
}
