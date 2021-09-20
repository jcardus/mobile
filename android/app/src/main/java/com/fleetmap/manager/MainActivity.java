package com.fleetmap.manager;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // --- Remove bridge init as it's deprecated and add these lines
    registerPlugin(com.capacitorjs.plugins.app.AppPlugin.class);
    registerPlugin(com.capacitorjs.plugins.device.DevicePlugin.class);
    // ---
  }
}
