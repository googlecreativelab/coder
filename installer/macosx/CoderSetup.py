
# Coder for Raspberry Pi
# A simple platform for experimenting with web stuff.
# http://goo.gl/coder
#
# Copyright 2013 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import time
import glob
import re
import os
import subprocess
from Tkinter import *
import tkFont
import threading

WINWIDTH = 776
WINHEIGHT = 390
BGCOLOR = "#3BD7EA"
ACTIVECOLOR = "#3BD7EA"
TEXTCOLOR = "#FFFFFF"
PROGRESSBG = "#FFFFFF"
BTNTEXT = "#2AD4E7"
BTNCOLOR = "#FFFFFF"

class Application(Frame):

    def createStartButton(self, master, onclick):
        b = Label( master )
        b.config( text="START", highlightthickness=1, highlightbackground=ACTIVECOLOR, background=BTNCOLOR, foreground=BTNTEXT, width=12, height=3 )
        b.bind("<Button-1>", onclick)
        b.place( x=336, y=80, anchor=NW )
        return b
    
    def createNextButton(self, master, onclick):
        b = Label( master )
        b.config( text="NEXT", highlightthickness=1, highlightbackground=ACTIVECOLOR, background=BTNCOLOR, foreground=BTNTEXT, width=12, height=3 )
        b.bind("<Button-1>", onclick)
        b.place( x=336, y=80, anchor=NW )
        return b
    
    def createDoneButton(self, master, onclick):
        b = Label( master )
        b.config( text="OK", highlightthickness=1, highlightbackground=ACTIVECOLOR, background=BTNCOLOR, foreground=BTNTEXT, width=12, height=3 )
        b.bind("<Button-1>", onclick)
        b.place( x=336, y=80, anchor=NW )
        return b
    
    def createStartOverButton(self, master, onclick):
        b = Label( master )
        b.config( text="START OVER", highlightthickness=1, highlightbackground=ACTIVECOLOR, background=BTNCOLOR, foreground=BTNTEXT, width=12, height=3 )
        b.bind("<Button-1>", onclick)
        b.place( x=336, y=80, anchor=NW )
        return b
    
    def createFormatButton(self, master, onclick):
        b = Label( master )
        b.config( text="INSTALL", highlightthickness=1, highlightbackground=ACTIVECOLOR, background=BTNCOLOR, foreground=BTNTEXT, width=12, height=3 )
        b.bind("<Button-1>", onclick)
        b.place( x=336, y=80, anchor=NW )
        return b
    
    def createInstructionTxt(self, master, text):
        instructionFont = tkFont.Font(family="Helvetica", size=18)
        instruction = Label( master, background=BGCOLOR, foreground=TEXTCOLOR, font=instructionFont )
        instruction["text"] = text
        instruction.place( relx=0.5, y=14, anchor=N )
        return instruction


    def createWidgets(self):
        #self.QUIT = Button(self)
        #self.QUIT["text"] = "QUIT"
        #self.QUIT["fg"]   = "red"
        #self.QUIT["command"] =  self.quit
        #self.QUIT.place( relx=0, rely=1, anchor=SW )


        self.step1Frame = Frame( width=WINWIDTH, height=190, background=BGCOLOR )

        self.step1Frame.instruction = self.createInstructionTxt( self.step1Frame, "Remove any SD Cards from your computer and click Start." )
        self.step1Frame.nextButton = self.createStartButton( self.step1Frame, self.preStep2 )


        self.step2Frame = Frame( width=WINWIDTH, height=190, background=BGCOLOR )
        self.step2Frame.nextButton = self.createNextButton( self.step2Frame, self.preStep3 )
        self.step2Frame.instruction = self.createInstructionTxt( self.step2Frame, "Insert an SD Card you wish to format with Coder." )
        

        self.step3Frame = Frame( width=WINWIDTH, height=190, background=BGCOLOR )
        self.step3Frame.nextButton = self.createFormatButton( self.step3Frame, self.preStep4 )
        self.step3Frame.instruction = self.createInstructionTxt( self.step3Frame, "Click Install to format this SD Card and install Coder." )
        self.step3Frame.progress = Meter( self.step3Frame, width=600, height=6, bg=PROGRESSBG, progcolor=ACTIVECOLOR )

        
        self.step4Frame = Frame( width=WINWIDTH, height=190, background=BGCOLOR )
        self.step4Frame.instruction = Label( self.step4Frame )
        self.step4Frame.instruction = self.createInstructionTxt( self.step4Frame, "Coder has been successfully installed. You may now remove your SD Card.\nFollow instructions at goo.gl/coder to get started." )
        self.step4Frame.instruction.place( relx=0.5, y=8, anchor=N )
        self.step4Frame.doneButton = self.createDoneButton( self.step4Frame, self.doneClick )

        self.errorFrame = Frame( width=WINWIDTH, height=190, background=BGCOLOR )
        self.errorFrame.soButton = self.createStartOverButton( self.errorFrame, self.step1 )
        self.errorFrame.instruction = Label( self.errorFrame )
        self.errorFrame.instruction = self.createInstructionTxt( self.errorFrame, "Error" )


        self.workingFrame = Frame( width=WINWIDTH, height=190, background=BGCOLOR )
        self.workingFrame.instruction = Label( self.workingFrame )
        self.workingFrame.instruction = self.createInstructionTxt( self.workingFrame, "Thinking..." )


        self.logoimg = PhotoImage( file="installerlogo.gif" )
        self.logo = Label(self)
        self.logo.config( background=BGCOLOR, image = self.logoimg )


        self.logo.place( x=170, y=55, anchor=NW )
        #self.logo.config( image = self.logoimg )
        #self.logo.geometry("+%d+%d" % (self.winfo_rootx()+50,
        #                                      self.winfo_rooty()+50))


    def doneClick( self, event=None ):
        self.quit()

    def createMenu(self):
        menu = Menu( root )
        root.config( menu=menu )



    def unPlace( self ):
        self.step1Frame.place_forget()
        self.step2Frame.place_forget()
        self.step3Frame.place_forget()
        self.step4Frame.place_forget()
        self.errorFrame.place_forget()
        self.workingFrame.place_forget()

    def showWorking(self, text ):
        self.unPlace()
        self.workingFrame.instruction['text'] = text
        self.workingFrame.place( relx=0, rely=1, anchor=SW )

    def step1( self, event=None ):
        self.existingDrives = []
        self.sdCardDev = -1
        self.unPlace()
        self.step1Frame.place( relx=0, rely=1, anchor=SW )
    
    def preStep2( self, event=None ):
        self.unPlace()
        self.showWorking( "Just a moment..." )
        self.update()
        time.sleep( 2 )
        self.existingDrives = glob.glob("/dev/rdisk?")
        for d in self.existingDrives:
            print( "existing drive: " + d ) 
        self.step2()


    def step2( self, event=None ):
        self.unPlace()
        self.step2Frame.place( relx=0, rely=1, anchor=SW )
        self.update()

    def preStep3( self, event=None ):
        self.unPlace()
        self.showWorking( "Looking for your SD Card..." )
        self.update()
        time.sleep( 2 )
        updatedDrives = glob.glob("/dev/rdisk?")
        self.newDrives = []
        for d in updatedDrives:
            found = False
            for o in self.existingDrives:
                if d == o:
                    found = True
                    break
            if not found:
                self.newDrives.append( d )
        for d in self.newDrives:
            print( "found new drive: " + d )

        if len( self.newDrives ) is not 1:
            self.errorRetry( "Your card wasn't correctly detected. Let's try again." )
            #self.errorRetry( "Error: found " + str( len( self.newDrives ) ) + " new disks inserted but expected 1" )
        else:
            self.showWorking( "SD Card found." )
            self.update()
            time.sleep(2)
            self.step3()

    def step3( self, event=None ):
        self.unPlace()
        self.step3Frame.progress.place_forget()
        self.step3Frame.nextButton.place( x=336, y=80, anchor=NW )
        self.step3Frame.instruction['text'] = "Click Install to format this SD Card and install Coder."
        self.step3Frame.place( relx=0, rely=1, anchor=SW )


    def preStep4( self, event=None ):
        global formatError, formatComplete, formatProgress

        self.update_idletasks();
        self.step3Frame.nextButton.place_forget()
        self.step3Frame.progress.place( relx=0.5, y=85, anchor=N )
        self.step3Frame.instruction['text'] = "Installing Coder on your SD Card."
        self.update_idletasks();

        formatProgress = 0.0
        formatComplete = False
        formatError = None

        formatThread = threading.Thread( target=formatSDDevice )
        formatThread.daemon = True
        formatThread.start()
        
        self.pollFormatProgress()

    def step4( self, event=None ):
        self.unPlace()
        self.step4Frame.place( relx=0, rely=1, anchor=SW )

    def pollFormatProgress( self ):
        global formatError, formatComplete, formatProgress
        
        if formatError is None and not formatComplete:
            self.step3Frame.progress.setProgress( formatProgress )
            self.after( 5, self.pollFormatProgress )
        elif formatError is not None:
            self.errorRetry( formatError )
            formatError = ""
            formatComplete = None
        else:
            self.step3Frame.instruction['text'] = "Install complete!"
            self.step3Frame.progress.setProgress( 1 )
            self.update()
            time.sleep(4)
            self.step4()
        self.update();

    def errorRetry( self, message ):
        self.unPlace()
        self.errorFrame.instruction["text"] = message
        self.errorFrame.place( relx=0, rely=1, anchor=SW )


    def __init__(self, master=None):
        Frame.__init__(self, master)
        self.config(width = WINWIDTH, height = WINHEIGHT, background=BGCOLOR)
        self.createMenu()
        self.pack_propagate(0)
        self.pack()
        self.createWidgets()
        self.update()
        self.step1()


    existingDrives = []
    newDrives = []
    sdCardDev = -1




class Meter( Frame ):
    def __init__(self, master, width=400, height=4, bg="#909090", progcolor="#f6e5fd", *args, **kw ):
        Frame.__init__(self, master, bg=bg, width=width, height=height, *args, **kw)

        self.canvas = Canvas( self, width=self['width'], height=self['height'] )
        self.canvas.pack( fill='both', expand=1 )
        self.progfill = self.canvas.create_rectangle( 0, 0, 0, height, fill=progcolor, width=0 )
        self.progress = 0.0
        self.setProgress(0)
        self.bind('<Configure>', self.redraw)

    def redraw(self, event=None):
        self.canvas.update_idletasks()
        self.canvas.coords( self.progfill, 0, 0, self.canvas.winfo_width() * self.progress, self.canvas.winfo_height() )
        self.canvas.update_idletasks()

    def setProgress(self, value=0.0):
        if value < 0.0:
            value = 0.0
        elif value > 1.0:
            value = 1.0

        self.progress = value
        self.redraw()
    
def formatSDDevice():
    global formatError, formatComplete, formatProgress
    formatComplete = False
    formatError = None
    formatProgress = 0.0

    device = app.newDrives[0]
    devreg = re.compile('^/dev/rdisk(\d+)$')
    m = devreg.match( device )
    if m:
        sdCardDev = m.group(1)
        print( "SD Card Device: " + str(sdCardDev) )
      
        logfile = "."
        if 'TMPDIR' in os.environ.keys():
            logfile = os.path.normpath( os.environ['TMPDIR'] )
        logfile = logfile + "/piformat.log"

        pythonexe = os.path.dirname(sys.argv[0]) + "/../MacOS/python"
        open( logfile, 'w' ).close()
        command = "osascript -e 'do shell script \"" + pythonexe + " -u formatsdcard.py really " + str( sdCardDev ) + " > " + logfile + " \" with administrator privileges'"
        print( "SYSTEM: " + command )
        #os.system( command )
        

        status = open( logfile, 'r' )
        st_results = os.stat(logfile)
        st_size = st_results[6]
        status.seek(st_size)
        proc = subprocess.Popen( command, shell=True )
        while True:
            #send siginfo ctrl-t
            #proc.stdin.write('\x14')
            root.update();
            where = status.tell()
            line = status.readline()
            if not line and proc.poll() is not None:
                break
            elif not line:
                time.sleep(0.01)
                status.seek(where)
            else:
                print( "PROGRESS: " + line.rstrip() )
                progreg = re.compile('^COMPLETEPCT: (\d\.\d+)')
                m = progreg.match( line )
                if m:
                    pct = float( m.group(1) )
                    formatProgress = pct
                time.sleep( 0.01 )
                #threading.Event().wait(0.01)
        print( "PROCESS COMPLETED" )
        if proc.poll() == 0:
            formatComplete = True
        else:
            formatError = "There was an error while writing to your SD Card."
        status.close()

    else:
        formatError = "Error: unexpected device id." 
        #app.errorRetry( "Error: unexpected device id." )



##MAIN

formatComplete = False
formatError = None
formatProgress = 0.0
formatThread = None
root = Tk()
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()
root.geometry("%dx%d+%d+%d" % (WINWIDTH, WINHEIGHT, screen_width/2-500, screen_height/2-250))
root.wm_title("Coder for Pi")
root.wm_client("Coder for Pi")
root.lift()
root.call('wm', 'attributes', '.', '-topmost', '1')
root.call('wm', 'attributes', '.', '-topmost', '0')

app = Application(master=root)
app.mainloop()
#root.destroy()
