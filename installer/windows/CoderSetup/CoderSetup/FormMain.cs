using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using CoderSetup.Properties;
using USB_Image_Tool_Helper;

namespace CoderSetup
{
    /// <summary>
    /// Small Wizard for Coder for Pi, uses Alexander Beug Usbit32 library
    /// <author email="erwin@ried.cl">Erwin Ried</author>
    /// <see cref="http://ried.cl"/>
    /// <seealso cref="http://www.alexpage.de"/>
    /// </summary>
    public partial class FormMain : Form
    {
        private int _currentStep = -1;
        private readonly String[] _messages =
            {
                "Remove any SD Cards from your computer and click Start.",
                "Insert an SD Card you wish to format with Coder.",
                "Click Install to format this SD Card and install Coder.",
                "Coder has been successfully installed. You may now remove your SD Card." + Environment.NewLine +
                "Follow instructions at goo.gl/coder to get started."
            };

        private string _imagePath;
        private bool _error, _finished, _initialized=false;
        private List<uint> _devices;
        private const string LibraryName = "usbit32.dll";

        public FormMain()
        {
            InitializeComponent();
            backgroundWorkerProcess.RunWorkerAsync();
        }

        private void buttonStart_Click(object sender, EventArgs e)
        {
            if (_finished)
                Application.Exit();
            else
            {
                buttonStart.Visible = false;
                backgroundWorkerProcess.RunWorkerAsync();
            }
        }

        private void backgroundWorkerProcess_DoWork(object sender, DoWorkEventArgs e)
        {
            if (_currentStep > -1 && !_initialized && !InitializeCmd())
            {
                backgroundWorkerProcess.ReportProgress(-1, "Error");
                _error = true;
            }

            var timer = Stopwatch.StartNew(); // Just to allow the user to read some messages if his PC is too fast
            if (_error) return;

            switch (_currentStep)
            {
                case -1:
                    backgroundWorkerProcess.ReportProgress(-2, new[] {"START", _messages[++_currentStep]});
                    break;

                case 0: 
                    backgroundWorkerProcess.ReportProgress(-1, "Just a moment..."); 
                    _devices = Usbit32.GetDevices(); // Detecting devices

                    do{} while (timer.Elapsed.TotalSeconds < 2);
                    backgroundWorkerProcess.ReportProgress(-2, new[] {"NEXT", _messages[++_currentStep]});
                    break;

                case 1:
                    backgroundWorkerProcess.ReportProgress(-1, "Looking for your SD Card...");
                    var t = Usbit32.GetDevices();

                    do{} while (timer.Elapsed.TotalSeconds < 2);
                    if (t.Count() == _devices.Count() + 1)
                    {
                        // Found one new SD
                        backgroundWorkerProcess.ReportProgress(-2, new[] {"INSTALL", _messages[++_currentStep]});

                        foreach (var d in t.Where(d => !_devices.Contains(d)))
                        {
                            _devices = new List<uint>(new[] {d});
                            break; // There is only one different...
                        }
                    }
                    else
                        StartOver("Your card wasn't correctly detected. Let's try again.");
                    break;

                case 2:
                    // Install image
                    _imagePath = Path.GetFullPath(Path.Combine(Path.GetDirectoryName(Process.GetCurrentProcess().MainModule.FileName),"raspi.img"));

                    if (!File.Exists(_imagePath))
                    {
                        backgroundWorkerProcess.ReportProgress(-2,new[]{"CLOSE","raspi.img was not found in same directory as installer app"});
                        _finished = true;
                    }
                    else
                    {
                        backgroundWorkerProcess.ReportProgress(-1, "Installing Coder on your SD Card.");
                        backgroundWorkerProcess.ReportProgress(0);

                        try
                        {
                            var restore = new Thread(RestoreImage);
                            var progress = 1;
                            restore.Start();
                            Thread.Sleep(2000);

                            do
                            {
                                Thread.Sleep(100);
                                var tmp = (int) Usbit32.GetProgress(_devices[0]);

                                if (tmp > progress && tmp <= progressBarInstallation.Maximum)
                                    progress = tmp;

                                backgroundWorkerProcess.ReportProgress(progress);

                            } while (Usbit32.GetRunning(_devices[0]));
                            restore.Abort();
                        }
                        catch
                        {
                            _error = true;
                        }

                        if (_error)
                        {
                            _error = false;
                            StartOver("There was an error while writing to your SD Card.");
                        }
                        else
                        {
                            backgroundWorkerProcess.ReportProgress(progressBarInstallation.Maximum);
                            backgroundWorkerProcess.ReportProgress(-2, new[] {"OK", "Install complete!"});
                            Thread.Sleep(2000);
                            _finished = true;
                            backgroundWorkerProcess.ReportProgress(-1, _messages[++_currentStep]);
                        }
                    }
                    break;
            }
        }

        private void RestoreImage()
        {
            var retry = Stopwatch.StartNew();
            do
            {
                uint error = 0;
                _error = true;
                Usbit32.RestoreVolume(_devices[0], _imagePath, 0, true, true, false, ref error);

                if (error == 0)
                {
                    _error = false;
                    return; // No errors
                }

            } while (retry.Elapsed.TotalSeconds<5); // Try until Windows closes the opened handles to the device (if possible)
        }

        private void StartOver(string msg)
        {
            _currentStep = -1;
            backgroundWorkerProcess.ReportProgress(-2, new[] { "START OVER", msg});
        }

        private void backgroundWorkerProcess_ProgressChanged(object sender, ProgressChangedEventArgs e)
        {
            switch (e.ProgressPercentage)
            {
                case -2: // Update button too
                    var t =  (String[])e.UserState;
                    buttonStart.Text = t[0];
                    labelStatus.Text = t[1];
                    progressBarInstallation.Visible = false;
                    break;

                case -1:
                    labelStatus.Text = (String)e.UserState;
                    progressBarInstallation.Visible = false;
                    break;

                default:
                    progressBarInstallation.Visible = true;
                    progressBarInstallation.Value = e.ProgressPercentage;
                    break;
            }
        }

        private bool InitializeCmd()
        {
            try
            {
                var t = Path.GetTempFileName();
                File.Delete(t);
                Directory.CreateDirectory(t);
                Environment.CurrentDirectory = t;

                File.WriteAllBytes(LibraryName, Resources.usbit32);
                Usbit32.LoadLibrary(LibraryName);
                _initialized = true;
                return true;
            }
            catch
            {
            }
            return false;
        }

        private void backgroundWorkerProcess_RunWorkerCompleted(object sender, RunWorkerCompletedEventArgs e)
        {
            if (!_error)
                buttonStart.Visible = true;
        }

        private void FormMain_FormClosed(object sender, FormClosedEventArgs e)
        {
            if (_initialized && _devices != null && _devices.Count > 0)
                try
                {
                    uint error = 0;
                    Usbit32.CancelOperation(_devices[0], ref error);
                }
                catch
                {
                }
        }
    }
}
