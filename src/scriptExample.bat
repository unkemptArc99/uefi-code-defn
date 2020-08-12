@echo somefile

:setup_edk2
cd edk2
call edksetup.bat
goto run_ecc

:run_ecc
cd BaseTools\Source\Python\Ecc\
ecc -t C:\git\Others\hackathon\uefi-code-defn\src\test\sample_environment -r C:\git\Others\hackathon\uefi-code-defn\src\test\Output\f1.csv