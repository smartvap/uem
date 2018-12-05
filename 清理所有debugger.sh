echo "List of source files involving code that enables debugger..."
bosshome; cd ngportal.ear/ngportal.war
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
ls $cur
done > target.lst
tar -czv -T target.lst -f ngportal_dbg_scripts_backup.tar.gz
rm target.lst
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
perl -p -i -e "s/debugger;//g" $cur
done

bosshome; cd charge.ear/charge.war
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
ls $cur
done > target.lst
tar -czv -T target.lst -f charge_dbg_scripts_backup.tar.gz
rm target.lst
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
perl -p -i -e "s/debugger;//g" $cur
done

bosshome; cd custcare.ear/custcare.war
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
ls $cur
done > target.lst
tar -czv -T target.lst -f custcare_dbg_scripts_backup.tar.gz
rm target.lst
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
perl -p -i -e "s/debugger;//g" $cur
done

bosshome; cd custsvc.ear/custsvc.war
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
ls $cur
done > target.lst
tar -czv -T target.lst -f custsvc_dbg_scripts_backup.tar.gz
rm target.lst
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
perl -p -i -e "s/debugger;//g" $cur
done

bosshome; cd ngsysadmin.ear/ngsysadmin.war
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
ls $cur
done > target.lst
tar -czv -T target.lst -f ngsysadmin_dbg_scripts_backup.tar.gz
rm target.lst
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
perl -p -i -e "s/debugger;//g" $cur
done

bosshome; cd ui-custsvc.ear/ui-custsvc.war
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
ls $cur
done > target.lst
tar -czv -T target.lst -f ui-custsvc_dbg_scripts_backup.tar.gz
rm target.lst
for cur in `grep -R "debugger;" * | awk -F":" '{print $1}' | uniq`; do
perl -p -i -e "s/debugger;//g" $cur
done