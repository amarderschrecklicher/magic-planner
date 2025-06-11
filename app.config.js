import { withAndroidManifest } from '@expo/config-plugins';

const withCustomNotificationColor = (config) => {
  return withAndroidManifest(config, async (config) => {
    const application = config.modResults.manifest.application[0];

    // Ukloni duplikate ako postoje
    application['meta-data'] = application['meta-data']?.filter(
      (item) => item['$']['android:name'] !== 'com.google.firebase.messaging.default_notification_color'
    ) || [];

    // Dodaj meta-data s override oznakom
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.firebase.messaging.default_notification_color',
        'android:resource': '@color/notification_icon_color',
        'tools:replace': 'android:resource',
      },
    });

    return config;
  });
};

export default function ({ config }) {
  return withCustomNotificationColor(config);
}
