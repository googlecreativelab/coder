//USB Image Tool 1.57
//COPYRIGHT 2006-2010 Alexander Beug
//http://www.alexpage.de

//Decompiled from USB Image Tool Helper

using System.Collections.Generic;

namespace USB_Image_Tool_Helper
{
    using System;
    using System.Runtime.InteropServices;
    using System.Text;

    public class Usbit32
    {
        public const int MAX_SIZE = 300;
        public const uint MODE_PREPARING = 0;
        public const uint MODE_READING = 1;
        public const uint MODE_WRITING = 2;
        public const uint REQ_VERSION_FAIL = 0;
        public const uint REQ_VERSION_INIT = 0x3e8;
        public const uint REQ_VERSION_TEST = 0x622;
        public static uint version = 0x3e8;
        public const int WM_DEVICECHANGE = 0x219;

        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool BackupVolume(uint device, string backupfile, string backupfilename, uint compression, bool physical, bool sizeignore, bool checksum, ref uint error);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool CancelOperation(uint device, ref uint error);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint CheckVersion();
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint CheckWindows();
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool ClearDevices();
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool FindDevices();
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool FindVolumes();
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetDeviceID(uint device, StringBuilder deviceid, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetDevicePath(uint device, StringBuilder devicepath, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern ulong GetDeviceSize(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetFirstDevice(bool physical);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetFriendlyName(uint device, StringBuilder friendlyname, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetLastErrorCode(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetLastErrorText(uint code, StringBuilder errtext, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetLocationInfo(uint device, StringBuilder locationinfo, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetNextDevice(bool physical);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetProgress(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetProgressMode(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetRunning(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern uint GetSerialNumber(uint device, StringBuilder serialnumber, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern ulong GetVolumeFree(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetVolumeFS(uint device, StringBuilder volumefs, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetVolumeName(uint device, StringBuilder volumename, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool GetVolumePath(uint device, StringBuilder volumepath, uint size);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern ulong GetVolumeSize(uint device);
        [DllImport("usbit32.dll", CharSet=CharSet.Auto, SetLastError=true)]
        public static extern bool RestoreVolume(uint device, string restorefile, uint compression, bool physical, bool sizeignore, bool trunc, ref uint error);

        // Some extra stuff ...
        internal static List<uint> GetDevices()
        {
            var d = new List<uint>();
            ClearDevices();
            FindDevices();

            for (var i = GetFirstDevice(true); i != 0; i = GetNextDevice(true))
                d.Add(i);

            return d;
        }

        [DllImport("kernel32.dll")]
        public static extern IntPtr LoadLibrary(string dllToLoad);
    }
}

