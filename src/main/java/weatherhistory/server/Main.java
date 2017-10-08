package weatherhistory.server;

import java.util.Optional;

import org.apache.catalina.core.StandardContext;
import org.apache.catalina.startup.Tomcat;

public class Main 
{
	public static final Optional<String> port = Optional.ofNullable(System.getenv("PORT"));
    
    public static void main(String[] args) throws Exception 
    {
    	Config config = new Config();
    	if (!config.getCreatedNew())
    	{
    		StartServer();
    	}
    	else
    	{
    		System.out.println("Created a new config file in the same directory as the .jar");
    		System.out.println("Please enter your CISE name and password into the config to connect to the database.");
    		System.out.println("Run this program again to start the server.");
    	}
    }
    
    public static void StartServer() throws Exception 
    {
    	//String baseFilePath = "src/main/webapp/";
        String contextPath = "/";
        String appBase = ".";
        Tomcat tomcat = new Tomcat();     
        tomcat.setPort(Integer.valueOf(port.orElse("8080")));
        tomcat.getHost().setAppBase(appBase);
        StandardContext context = (StandardContext)tomcat.addWebapp(contextPath, appBase);
        //context.addServletContainerInitializer(sci, classes);
        //StandardContext context = (StandardContext)tomcat.addWebapp(contextPath, new File(baseFilePath).getAbsolutePath());
        //System.out.println("configuring app with basedir: " + new File("./" + baseFilePath).getAbsolutePath());
        
        tomcat.start();
        tomcat.getServer().await();
    }
    
}