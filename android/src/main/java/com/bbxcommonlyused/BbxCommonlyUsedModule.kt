package com.bbxcommonlyused

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.view.inputmethod.InputMethodInfo
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import java.lang.reflect.Method
import java.util.Locale

class BbxCommonlyUsedModule(
    reactContext: ReactApplicationContext
) : NativeBbxCommonlyUsedSpec(reactContext) {

    private val inputMethodManager: InputMethodManager =
        reactContext.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager

    @ReactMethod
    override fun getApiLevel(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT)
    }

    @ReactMethod
    override fun hasGms(promise: Promise) {
        var withGms = false

        try {
            val googleApiAvailability =
                Class.forName("com.google.android.gms.common.GoogleApiAvailability")

            val getInstanceMethod: Method =
                googleApiAvailability.getMethod("getInstance")

            val gmsObject = getInstanceMethod.invoke(null)

            val isGooglePlayServicesAvailableMethod =
                gmsObject.javaClass.getMethod(
                    "isGooglePlayServicesAvailable",
                    Context::class.java
                )

            val result = isGooglePlayServicesAvailableMethod.invoke(
                gmsObject,
                reactApplicationContext
            ) as Int

            withGms = result == 0
        } catch (_: Exception) {
            withGms = false
        }

        promise.resolve(withGms)
    }

    @ReactMethod
    override fun hasHms(promise: Promise) {
        var withHms = false

        try {
            val huaweiApiAvailability =
                Class.forName("com.huawei.hms.api.HuaweiApiAvailability")

            val getInstanceMethod =
                huaweiApiAvailability.getMethod("getInstance")

            val hmsObject = getInstanceMethod.invoke(null)

            val isHuaweiMobileServicesAvailableMethod =
                hmsObject.javaClass.getMethod(
                    "isHuaweiMobileServicesAvailable",
                    Context::class.java
                )

            val result = isHuaweiMobileServicesAvailableMethod.invoke(
                hmsObject,
                reactApplicationContext
            ) as Int

            withHms = result == 0
        } catch (_: Exception) {
            withHms = false
        }

        promise.resolve(withHms)
    }

    @SuppressLint("HardwareIds")
    @ReactMethod
    override fun getUniqueId(promise: Promise) {
        promise.resolve(
            Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ANDROID_ID
            )
        )
    }

    @SuppressLint("HardwareIds")
    @ReactMethod
    override fun isEmulator(promise: Promise) {
        val result =
            Build.FINGERPRINT.startsWith("generic") ||
            Build.FINGERPRINT.startsWith("unknown") ||
            Build.MODEL.contains("google_sdk") ||
            Build.MODEL.lowercase(Locale.ROOT).contains("droid4x") ||
            Build.MODEL.contains("Emulator") ||
            Build.MODEL.contains("Android SDK built for x86") ||
            Build.MANUFACTURER.contains("Genymotion") ||
            Build.HARDWARE.contains("goldfish") ||
            Build.HARDWARE.contains("ranchu") ||
            Build.HARDWARE.contains("vbox86") ||
            Build.PRODUCT.contains("sdk") ||
            Build.PRODUCT.contains("google_sdk") ||
            Build.PRODUCT.contains("sdk_google") ||
            Build.PRODUCT.contains("sdk_x86") ||
            Build.PRODUCT.contains("vbox86p") ||
            Build.PRODUCT.contains("emulator") ||
            Build.PRODUCT.contains("simulator") ||
            Build.BOARD.lowercase(Locale.ROOT).contains("nox") ||
            Build.BOOTLOADER.lowercase(Locale.ROOT).contains("nox") ||
            Build.HARDWARE.lowercase(Locale.ROOT).contains("nox") ||
            Build.PRODUCT.lowercase(Locale.ROOT).contains("nox") ||
            (Build.VERSION.SDK_INT < Build.VERSION_CODES.O &&
                Build.SERIAL.lowercase(Locale.ROOT).contains("nox")) ||
            (Build.BRAND.startsWith("generic") &&
                Build.DEVICE.startsWith("generic")) ||
            hasKeyboard("memuime")

        promise.resolve(result)
    }

    @ReactMethod
    override fun requestNotificationPermission(promise: Promise) {
        promise.resolve(false)
    }

    private fun hasKeyboard(name: String): Boolean {
        val inputMethodList: List<InputMethodInfo> =
            inputMethodManager.enabledInputMethodList ?: return false

        val target = name.lowercase(Locale.ROOT)

        for (inputMethodInfo in inputMethodList) {
            val serviceName =
                inputMethodInfo.serviceName?.lowercase(Locale.ROOT).orEmpty()

            val id =
                inputMethodInfo.id?.lowercase(Locale.ROOT).orEmpty()

            if (serviceName.contains(target) || id.contains(target)) {
                return true
            }
        }

        return false
    }

    companion object {
        const val NAME = NativeBbxCommonlyUsedSpec.NAME
    }
}