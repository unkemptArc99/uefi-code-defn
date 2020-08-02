@echo somefile
cd edk2
edksetup.bat
cd BaseTools\Source\Python\Ecc\
ecc -t C:\git\Others\hackathon\uefi-code-defn\src\test\sample_environment -r C:\git\Others\hackathon\uefi-code-defn\src\test\Output\f1.csv