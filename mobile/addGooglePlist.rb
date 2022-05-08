#import the xcodeproj ruby gem
require 'xcodeproj'
#define the path to your .xcodeproj file
project_path = 'App.xcodeproj'
#open the xcode project
project = Xcodeproj::Project.open(project_path)
#find the group on which you want to add the file
group = project.main_group.children[0]
puts group
file = group.new_file('GoogleService-Info.plist')
puts 'add the file reference to the projects first target'
main_target = project.targets.first
puts main_target
main_target.add_file_references([file])
puts file
#finally, save the project
project.save
