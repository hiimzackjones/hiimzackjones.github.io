--- 
layout: post 
title: 
date: 2017-10-16 12:32:00 -0400 
categories: Linux 
---
## What is linux?

Linux is a unix based operating system that was developed during the 90s and is made up of many different versions and distributions for various needs ranging from Retail Point of Sale systems to GPS systems, cell phone operating systems, and even hacking tools. Linux is known for having particular features like:
- Being a free operating system as well as server option
- Having an open source development system and use. 
- easily modifiable and to create custom systems for specific needs
- Being extremely reliable. 

## Open Source vs Closed Source
Linux is known as an Open Source system. This means two things: 
* It first means that essentially anyone can be part of the development. When working on systems as vital as a full operating system, having varying developers means that the systems are almost always secure and reliable. Applications that are open source developed often go through many improvements and changes and are facilitated using a version control system. To put it simply, imagine many different suggestions for what to do next on a project, and then the best options get put into play.
* It also means that the rights to use the software is generally open and free for anyone to use. 
Open source allows to have as many people using and working on the progress of the system at once. In theory this makes the system inheirently stronger. 


## Distros
Distros are short for Distributions and the different versions of linux. Sometimes Distros are created or forked from different opinions or methods for doing something in the Open Source Development process. Distros are also created for specific needs, like taking a system and adjusting it so it works well in a manufacturing environment for controlling machines, or creating a system that works on a small embedded device. 
> Note: Information about distros and their updates can be found on DistroWatch.com

## Live Boot
A popular way to run Linux is the Live boot. Often users have machines with operating systems already installed and want to use Linux periodically or for special use cases, for that the Live boot comes in handy. Live booting is simple:
* Download the linux distro’s ISO from it’s website. Find the appropriate website from distrowatch.com
* Burn the ISO to a Disk or to a USB Flash drive. 
* Boot your machine up and use the appropriate key combination during startup to tell the computer to boot to the CD or to do Flash drive. 
* You’re live! 
Live Booting allows a user to explore Linux or use it as if it was installed like a typical Operating system. Live booting allows you to work in an isolated system, not interfering with the hard drive or the original operating system.  

This makes it good for system and hardware diagnosis as well as leaving a limited footprint. Because it’s isolated from the harddrive, it doesn’t have a way to save files beyond the computer’s shutdown. This lack of persistence is both a benefit as well as a limitation. Some flash drive installs can be formatted and installed with a part of its available storage as persistent storage to remedy this. 
> Note: When running live, you’re running directly from RAM, meaning it’s resource intensive. You’ll need a bit of extra RAM to run a live boot. 


## Linux vs Unix
You may see some people use these titles interchangeably or even use *NIX to talk about either of them. What you need to know is that Linux was developed from Unix, in the same way Windows was developed from DOS. Other operating systems are also based off Unix like MacOS, Android, iOS, and even Playstation 4. To put it simply, everything that isn’t Windows is most likely based off a Unix system.  


## Why is Linux Important?
Linux is an IT admin’s dream. Linux has been known to have very little virus issues, is often crash proof, and gets updated very quickly. That along with it’s price (free) makes it great for servers, small business networks, and development environments. The ease of development on a Linux or Unix based system make it great for developers. The availability of tools like bash scripts also make it easy for Admins to do tasks that sometimes can take a long time if done step by step. 

---


# Installing Ubuntu Linux (in progress)
1. Download the Ubuntu iso from the Ubuntu website. 
2. Burn the ISO to a CD, DVD, or burned onto a Flashdrive
3. While starting up your machine, use the appropriate key combination to get to the boot options and choose the medium that the linux installer is located
4. The computer will now boot into the installer. 
5. The installer will ask for the language to use during the install 
6. Pick Install Ubuntu to install onto the machine’s harddrive. This install process will format the harddrive partition and erase all data on that drive. 
7. The preparing to install download menu will prompt you to allow it to download updates and additional third party software during install. Choose these now. 
8. The installation type menu will ask you how to handle the the formatting of the harddrive. You can choose to erase and install. You’ll also be prompted for the options of hard drive encryption and Logical Volume management. These are not mandatory for the install but could be useful. 
9. Click install now and a prompt will review how the harddrive will be handled and what options will be included. Review and click continue to start the install. 
10. It will ask about your timezone and location. Choose your location and press continue. 
11. Select your keyboard layout and hit continue. 
12. You’ll be prompted to enter in user account information including the name and and password. Fill this out and hit continue.
13. The install will begin and a progress bar will be shown. This may time some time. 
14. Once the install is complete, it will prompt you to restart. Once the computer restarts, the install is complete.

---

# Working in the Terminal
Write about using the terminal for the first time. how the $ works. etc. 

## Basic Bash Commands

### cd
<code>cd [OPTION] {directory-name}</code>
The cd command takes a directory as an argument and changes the shell’s active working directory. You can move into directories that are within other directories as well as moving out of a directory you’re in into a previous directory as well. You can also use the ~ as an alias for the home directory.   
Examples
$ cd Documents
Moves into the directory Documents
$ cd Documents/MyMovies
Moves into the directory MyMovies that is located in Documents
$ cd ~/Downloads/10-12-2017/pictures
Moves into the directory pictures from the directory 10-12-2017 that is in Downloads from any working directory
$ cd ../
Moves back a directory


### man
<Code>man [OPTION] {keyword}</code>
The man command will take a keyword argument and display a manual page for the keyword. Generally the keyword should be another bash command or application. 
Examples
<code>$man ls</code>
This will display the syntax and use of the ls command and it’s available options. 

### ls
<code>ls [OPTION]</code>
The ls command prints out the contents of a directory. This includes files, directories and executables. 
The ls command has various options that can be useful.  
Examples
<code>$ls -l<c/ode> 
will show a long listing of the file or directory you are in. This is good for seeing additional information like individual file’s permissions.
<code>$ls -A</code> 
will show all hidden files in the directory you are in. Hidden files in Linux display with a “.” in its file name. A hidden file or “hidden directory” is typically used for storing user preferences or preserving the state of a utility. 

### Echo
Write about echo. 


### Creating/removing/relocating files and directories

Mkdir
mkdir [OPTION] {directory-name}
The mkdir command takes a new directory name as an argument and creates that directory. will create a new empty directory. 
Examples
$mkdir NewFolder
This will create a new directory called NewFolder 




Rmdir
rmdir [OPTION] {directory-name}
The rmdir command takes an existing directory as an argument and deletes that directory. This command only removes empty directories. 
Examples
$ rmdir OldDirectory
This removes the directory called OldDirectory 




rm 
rm [OPTION] {file-name}
The rm command takes a file as an argument and deletes that file. 
A popular option to use with rm is the -r option. This option removes recursive files within a directory and can be used as a substitution to rmdir. 
Examples
$ rm deletethis.txt
This deletes the file deletethis.txt
$ rm -r ThisFolderWillBeDeletedIncludingTheFilesInside
This deletes the folder ThisFoldWillBeDeletedInculdingTheFIlesInside and the recusive files and directories. 












Cp
cp [OPTION] {file-name}{new-file-name}
The cp command copies a file and takes two arguments. First argument being the file to be copied, and the second argument being the name of the new copied version of the file. You can also copy multiple files, a directory and it’s recursive files or copy a file into another directory. 
Examples
$ Cp FileNeededToBeCopied TheCopyOfTheFile
Creates a copy of FileNeededToBeCopied called TheCopyofTheFile
$ Cp File1 /Documents/file2
Creates a copy of File1 into the directory Documents called file2
$ Cp CopyThis This AndThis Documents/ToThisDirectory 
Creates copies of CopyThis and This and AndThis into the directory ToThisDirectory in the Documents directory
$ Cp -r  AFolderAndContents NewFolder
Copies the folder AFolderAndContents and the contents into a new directory called NewFolder




Mv
mv [OPTION] {file-name}{directory-name}
The mv command takes two arguments. The first being a file that you’d like to move and then second being a directory you’d like to move it into. You can also change the name of the moved file or move all files located in a directory to a new directory. 
Examples
Mv File.iso Folder1
This moves the file File.iso into Folder1
Mv picture.jpeg Pictures/CoolPicture.jpeg
This moves the file picture.jpeg into the folder Pictures and renames it to CoolPicture.jpeg
Mv * /Documents/MovedFiles
This moves all files in the current working directory into the folder called MovedFiles located in Documents




Less
less [OPTION] {file-name}
The less command takes a filename as an argument and prints onto the screen one page at a time. It allows you to scroll within a text file. Only used for viewing the contents of the file. Use q to quit less. 
Examples




More
more [OPTION] {file-name}
The more command is a pager used to view the contents of a text file, similar to less, only one screen a time. The “space bar” is used to move forward and “q” to quit. 
 Command syntax is:
more [options] [file_name]


Head
head [OPTION] {file-name}
By using the head command, it will display the few lines of text to show on the terminal screen. Option -n can be used to set a specific number of lines returned on the output display.
The command syntax is:
head [options] [file_name]
Example 


Tail
tail [OPTION] {file-name}
The tail command will display the last few lines of text in the output on the terminal screen. Tail can used to monitor files in real time to see new lines being added to it using the -f option. Also the -n or just -[specific number] to display, such as -4
The command syntax is:
tail [option] [file_name]






Cat
cat [OPTION] {file-name}
The cat command can be used in three different ways. It’s general purpose is to display contents of a file onto the command line. 


## Touch


* Bash Commands II: 
* Networking Commands
ifconfig
ifconfig [OPTION]
The ifconfig is a multi-functional tool that deals with the configuration of network interfaces. You can list various interfaces, enable or disable an interface, assign an IP or a subnetmask to an interface, etc. 
Some of the fundamental ifconfig commands and options are:
$ifconfig
Show running interfaces
$ifconfig -a
Show all interfaces
$ifconfig eth0
Show only a single interface. In this case eth0.
$ifconfig wlan0 down
Disable an interface. In this case wlan0
$ifup eth0
Shorthand for ifconfig eth0 up. Enables an interface. In this case eth0. 
$ifconfig wlan0 192.168.1.107
Sets an interface’s IP address to static. In this case with the IP of 192.168.1.107.  
$ifconfig eth1 netmask 255.255.255.224
Sets an interface's subnet mask. In this case sets the interface eth1 to have a subnet mask of 255.255.255.224.



