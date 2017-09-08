# Chapter 2 notes

Every computer needs an OS
Networking devices have NOS (Cisco IOS)


OS contains Shell Kernel and Hardware

Shell - user interface. CLI or GUI
Kernel - talks between hardware and software of computer. Manages resources. 
Hardware - electronics stuffs. You Know. 

GUI allows for 
- mouse (or touchscreen)
- text and text based commands
- view output on monitor or screen

CLI allows for 
- Keyboard as standard input into a CLI
- Keyboard to run programs
- View output on monitor or screen 

Accessing three different ways. 

- Console - Serial connection directly into device before the device is up and running. If a router is shutdown, this is how you'd have to communicate with it. VTY
- Telnet - Network connected shell. Needs to be configured on router to allow for network connections. If IP isn't available for this, this can't be used. 
- SSH - esentially Telnet, but the commands and data send over the network are sent as encrypted instead of plain text. (protects from sniffing) 
- AUX - Similar to Console. 

Terminal Emulators
Needed to see the Cisco Terminal from a GUI based OS or envirnoment. 
- PuTTY
- Tera Term
- SecureCRT
- OS X Terminal 
- LINUX/UNIX terminal

To get to console in Packet Tracer you can either access it via a PC connected with a console cable or right from the UI for the device. 

<code> end </code>
to get back to privlidged EXEC mode
<code> exit </code> 
to get to global config or move back a config mode. 


<code> switch> show ip protocols </code>

in this example <code>switch> </code> is the prompt
<code>show</code> is the command
and <code> ip protocols </code> is the keyword or argument. 

