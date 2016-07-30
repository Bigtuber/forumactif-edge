(function() {
  if (!window.FAE) {
    window.FAE = new Object();
  }

  FAE.raw = 'https://raw.githubusercontent.com/SethClydesdale/forumactif-edge/master/';
  FAE.eGIF = 'http://illiweb.com/fa/empty.gif';
  FAE.delay = 1000;
  FAE.cp_lang = {};

  // parse variables in strings for translations
  FAE.parse_vars = function(str, o) {
    var i;

    for (i in o) {
      str = str.replace(new RegExp(i, 'gm'), o[i]);
    }

    return str;
  };

  // log messages to the logger so the user knows what's going on
  FAE.logger = document.getElementById('fae_log');
  FAE.log = function(str, css) {
    FAE.logger.insertAdjacentHTML('beforeend', '<div class="fae_msg_log" ' + (css ? 'style="' + css + '"' : '') + '>' + str + '</div>');
    FAE.logger.scrollTop = 99999;
  };

  // increase size of progress bar
  FAE.bar = document.getElementById('fae_progress');
  FAE.progress = function() {
    var percent = (FAE.index / FAE.quota * 100).toFixed(2);
    FAE.bar.innerHTML = '<div id="fae_prog_bar" style="width:' + percent + '%;"></div><span id="fae_prog_number">' + (percent == 100 ? (FAE.cp_lang.fae_install_complete || 'COMPLETE!') : percent + '%') + '</span>';
  };

  // get update files and combine their steps into one array for consecutive execution
  FAE.getUpdates = function() {
    if (++FAE.update_index >= FAE.update_quota) {
      FAE.log(FAE.cp_lang.fae_update_start || 'Updates are about to begin, please do not close this tab.');

      // get the update utilities and begin the update process
      $.get(FAE.raw + 'updates/utils.js', function(d) {
        FAE.script(d);
        FAE.next();
      });

    } else {
      FAE.log(FAE.cp_lang.fae_update_fetch ? FAE.parse_vars(FAE.cp_lang.fae_update_fetch, {
        '{VERSION_STRING}' : FAE.update_queue[FAE.update_index],
        '{UPDATE_MIN}' : FAE.update_index + 1,
        '{UPDATE_MAX}' : FAE.update_queue.length

      }) : 'Getting update instructions for version ' + FAE.update_queue[FAE.update_index] + '... (' + (FAE.update_index + 1) + '/' + FAE.update_queue.length + ')');

      $.get(FAE.raw + 'updates/' + FAE.update_queue[FAE.update_index] + '.js', function(d) {
        FAE.script(d);

        FAE.log(FAE.cp_lang.fae_update_notes ? FAE.parse_vars(FAE.cp_lang.fae_update_notes, {
          '{RELEASE_TAG}' : FAE.update_tag,
          '{VERSION_STRING}' : FAE.update_queue[FAE.update_index]

        }) : 'Please <a href="' + FAE.update_tag + '" target="_blank">Click here</a> to view the changes made in version ' + FAE.update_queue[FAE.update_index] + '.');

        FAE.step = FAE.step.concat(FAE.update_step);
        FAE.getUpdates();

      }).error(function() {
        FAE.log(FAE.cp_lang.fae_update_error ? FAE.parse_vars(FAE.cp_lang.fae_update_error, {
          '{VERSION_STRING}' : FAE.update_queue[FAE.update_index]

        }) : 'Update instructions for version ' + FAE.update_queue[FAE.update_index] + ' could not be found. Please <a href="https://github.com/SethClydesdale/forumactif-edge/issues/new" target="_blank">open a new issue</a> and provide this information for further assistance.', 'color:#E53;font-weight:bold;');

        FAE.getUpdates();
      });
    }
  };

  // create and execute script
  FAE.script = function(content) {
    var script = document.createElement('SCRIPT');
    script.type = 'text/javascript';
    script.text = content;
    document.body.appendChild(script);
  };

  // stuff that needs to be executed when the doc is ready
  $(function() {
    var admin = $('a[href^="/admin/"]')[0], // get the AP link so we can fetch the TID
        installed = document.getElementById('fa_edge');

    // only allow the founder to install the theme
    if (_userdata.user_id == 1 && admin) {
      FAE.tid = admin.href.replace(/.*?(&tid=.*)/, '$1'); // cache the tid
      document.getElementById('fae_actions').style.display = 'block';

      // Installation initialization
      document.getElementById('fae_install').onclick = function() {
        if (confirm( (FAE.cp_lang.fae_install_warning ? FAE.parse_vars(FAE.cp_lang.fae_install_warning, {
          '{TYPE}' : installed ?  FAE.cp_lang.fae_reinstall : FAE.cp_lang.fae_install

        }) : 'Are you sure you want to ' + ( installed ? 're' : '' ) + 'install Forumactif Edge? This will overwrite your current theme and delete your current JavaScripts. \\\n\\\nPlease make sure to backup all your personal content files such as CSS, Templates, and JavaScripts before proceeding. Click "Cancel" if you\'re not ready to install Forumactif Edge.').replace(/\\/g, '') )) {

          $.get(FAE.raw + 'javascripts/install.js', function(d) {
            FAE.script(d);
            FAE.next();
          });

          document.getElementById('fae_options').style.display = 'none';
        }
      };

      // extra actions for when the theme is installed.
      if (installed) {
        var uninstall = document.getElementById('fae_uninstall'),
            update = document.getElementById('fae_update');

        document.getElementById('fae_install').value = FAE.cp_lang.reinstall || 'Reinstall';

        $([uninstall, update]).show();

        // Uninstallation initialization
        uninstall.onclick = function() {
          if (confirm( (FAE.cp_lang.fae_uninstall_warning || 'Are you sure you want to uninstall Forumactif Edge? All CSS, JavaScript, and Template changes will be deleted ; The forum will be reverted to the default phpbb3 theme. \\\n\\\nPlease make sure to backup all your personal content files such as CSS, Templates, and JavaScripts before proceeding. Click "Cancel" if you don\'t want to uninstall Forumactif Edge yet.').replace(/\\/g, '') )) {

            $.get(FAE.raw + 'javascripts/uninstall.js', function(d) {
              FAE.script(d);
              FAE.next();
            });

            document.getElementById('fae_options').style.display = 'none';
          }
        };


        // Check for updates
        update.onclick = function() {
          FAE.log(FAE.cp_lang.fae_update_check || 'Checking for updates on Github...');
          document.getElementById('fae_options').style.display = 'none';

          $.get(FAE.raw + 'javascripts/version-data.js', function(d) {
            FAE.script(d.replace(/forumactif_edge_version_data/, 'fae_github_version_data'));
            FAE.version_string = d; // save version data for later so we can update the forum version info

            if (forumactif_edge_version_data.length < fae_github_version_data.length) {

              FAE.update_queue = fae_github_version_data.slice(forumactif_edge_version_data.length, fae_github_version_data.length);
              FAE.update_index = -1;
              FAE.update_quota = FAE.update_queue.length;

              FAE.log(FAE.update_queue.length + ' update' + ( i == 1 ? '' : 's' ) + ' found.');
              FAE.log(FAE.cp_lang.fae_update_prepare || 'Preparing to fetch update instructions, please do not close this tab...');

              FAE.step = [];
              FAE.getUpdates();

            } else {
              FAE.log(FAE.cp_lang.fae_update_good || 'Forumactif Edge is up to date!', 'color:#8B5;font-weight:bold;');
              document.getElementById('fae_options').style.display = 'block';
            }
          });
        };


        // create and insert translation button
        if (!FAE.board_lang) {
          FAE.board_lang = 'English'; // set the board lang to English if it is undefined
        }

        var opts = document.getElementById('fae_options');

        // create and insert the translation action
        $(opts).append(
          $('<div style="float:right;">'+
            '<select id="fae_selected_language">'+
              '<option value="Arabic">العربية</option>'+
              '<option value="Dutch">Dutch</option>'+
              '<option value="English">English</option>'+
              '<option value="Français">Français</option>'+
              '<option value="German">Deutsch</option>'+
              '<option value="Greek">Ελληνικά</option>'+
              '<option value="Romanian">Romana</option>'+
            '</select>'+
            '<input id="fae_translate" type="button" value="Change language" />'+
          '</div>')[0]
        );

        // set the selected translation
        for (var a = document.getElementById('fae_selected_language').options, i = 0, j = a.length; i < j; i++) {
          if (FAE.board_lang == a[i].innerHTML) {
            a[i].selected = true;
            a[i].id = 'fae_current_language';
            a[i].parentNode.insertBefore(a[i], a[0]);
            a[0].insertAdjacentHTML('afterend', '<optgroup label="----------------"></optgroup>');
            break;
          }
        }

        // function to be executed when the translation button is clicked
        document.getElementById('fae_translate').onclick = function() {
          var select = document.getElementById('fae_selected_language'),
              current = document.getElementById('fae_current_language'),
              selected = select.options[select.selectedIndex];

          if (FAE.board_lang == selected.innerHTML) {
            return alert(FAE.cp_lang.fae_translate_same ? FAE.parse_vars(FAE.cp_lang.fae_translate_same, {
              '{LANG}' : selected.innerHTML

            }) : 'Forumactif Edge is already in ' + selected.innerHTML + '. Please choose another language.');
          }

          if (confirm(FAE.cp_lang.fae_translate_warning ? FAE.parse_vars(FAE.cp_lang.fae_translate_warning, {
            '{LANG}' : selected.innerHTML

          }) : 'Are you sure you want to change the language of Forumactif Edge to ' + selected.innerHTML + ' ?')) {

            FAE.log(FAE.cp_lang.fae_translate_start || 'Translation of Forumactif Edge will commence shortly. Please wait..');
            FAE.log(FAE.cp_lang.fae_translate_get ? FAE.parse_vars(FAE.cp_lang.fae_translate_get, {
              '{LANG}' : current.innerHTML

            }) : 'Getting ' + current.innerHTML + ' language data...');

            $.get(FAE.raw + 'lang/' + current.value + '.js', function(d) {
              FAE.log(FAE.cp_lang.fae_translate_get ? FAE.parse_vars(FAE.cp_lang.fae_translate_get, {
                '{LANG}' : selected.innerHTML

              }) : 'Getting ' + selected.innerHTML + ' language data...');

              FAE.script(d.replace('FAE.lang', 'FAE.lang_current'));

              $.get(FAE.raw + 'lang/' + selected.value + '.js', function(d) {
                FAE.log(FAE.cp_lang.fae_translate_loaded || 'Language data has been loaded. The translation process will now begin, please do not close this tab.');
                FAE.script(d.replace('FAE.lang', 'FAE.lang_new'));

                $.get(FAE.raw + 'lang/translate.js', function(d) {
                  FAE.script(d);
                  FAE.next();
                });
              });
            });

            document.getElementById('fae_options').style.display = 'none';
          }
        };


        // create and insert the theme switcher
        if (window.location.host == 'themedesign.forumotion.com') {

          $(opts).append(
            $('<div style="text-align:right;clear:both;margin-top:6px;">'+
              '<select id="fae_selected_theme">'+
                '<option value="fa_edge">Edge Default</option>'+
                '<option value="fa_edge_dark">Edge Dark</option>'+
              '</select>'+
              '<input id="fae_change_css" type="button" value="Change theme" />'+
              '<div>'+
                '<span id="fae_label_min" class="fae_label">Minified :</span> <input id="fae_theme_min" type="checkbox" checked />'+
                '<span id="fae_label_rtl" class="fae_label">Right-to-Left :</span> <input id="fae_theme_dir" type="checkbox" />'+
              '</div>'+
            '</div>')[0]
          );

        }


        // setup and begin translation of control panel
        $.get(FAE.raw + 'lang/' + document.getElementById('fae_selected_language').value + '.js', function(d) {
          FAE.script(d.replace('FAE.lang', 'FAE.cp_lang'));
          FAE.cp_lang = FAE.cp_lang.fae_cp;

          var title = $('.fae_cp_title', document.getElementById('fae_cp'));

          document.getElementById('fae_cp_main_title').innerHTML = FAE.cp_lang.fae_cp_main_title;
          document.getElementById('fae_cp_desc').innerHTML = FAE.cp_lang.fae_cp_desc;
          document.getElementById('fae_install').value = installed ? FAE.cp_lang.fae_reinstall : FAE.cp_lang.fae_install;
          document.getElementById('fae_uninstall').value = FAE.cp_lang.fae_uninstall;
          document.getElementById('fae_update').value = FAE.cp_lang.fae_update;
          document.getElementById('fae_translate').value = FAE.cp_lang.fae_translate;

          title[0].innerHTML = FAE.cp_lang.fae_log;
          title[1].innerHTML = FAE.cp_lang.fae_actions;
        });
      }

    } else {
      FAE.log(FAE.cp_lang.fae_err_not_founder || 'Only <a href="/u1">the founder</a> may use this control panel. Please contact them for assistance in installing Forumactif Edge.', 'color:#E53;font-weight:bold;');
    }
  });
}());
